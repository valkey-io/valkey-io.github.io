#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.10"
# dependencies = ["jsonschema==4.26.0", "license-expression==30.4.4"]
# ///
"""Check the catalog files in `_data/libraries/` against `schema.json` and the SPDX License List.

Run it as `./build/validate-libraries.py`, or as `python3 build/validate-libraries.py` after
installing the dependencies in the `# /// script` header.
"""

import http.client
import json
import pathlib
import re
import sys
import time
import urllib.request

import jsonschema
from license_expression import LicenseSymbol, Licensing

SPDX_VERSION = "3.29.0"
SPDX_URL = f"https://raw.githubusercontent.com/spdx/license-list-data/v{SPDX_VERSION}/json"
DOWNLOAD_ATTEMPTS = 3

ROOT = pathlib.Path(__file__).resolve().parent.parent
LIBRARIES = ROOT / "_data" / "libraries"
# Each manifest group, and the directory of the same name, holds entries of one `$defs` kind.
DEFINITION_FOR_GROUP = {"clients": "client", "integrations": "integration"}
GROUPS = list(DEFINITION_FOR_GROUP)
FILE_NAME = r"[a-z0-9]+(-[a-z0-9]+)*\.json"

# `load_json` returns this for a file it has already reported. It isn't `None`,
# because a file that contains JSON `null` parses to `None` and must still
# reach the schema check.
INVALID = object()


def repo_path(path):
    """Return `path` relative to the repository root, for messages."""
    return path.relative_to(ROOT).as_posix()


def reject_duplicate_keys(pairs):
    """Build a JSON object, raising `ValueError` if a key appears more than once."""
    keys = [key for key, _ in pairs]
    duplicates = sorted({key for key in keys if keys.count(key) > 1})
    if duplicates:
        # Reviewers read the diff, and with a repeated key the site silently uses the last value.
        verb = "appears" if len(duplicates) == 1 else "appear"
        raise ValueError(f"{', '.join(repr(key) for key in duplicates)} {verb} more than once")
    return dict(pairs)


def load_json(path, problems):
    """Return the parsed file, or INVALID after recording why it can't be read."""
    try:
        return json.loads(path.read_text(encoding="utf-8"), object_pairs_hook=reject_duplicate_keys)
    except ValueError as error:
        problems.append(f"{repo_path(path)}: is not valid JSON: {error}")
        return INVALID


def schema_problems(path, data, schema, definition):
    """Return one line per way `data` breaks `schema["$defs"][definition]`."""
    lines = []
    # The root keeps `$defs`, so the definition's `$ref`s to the shared fields resolve.
    validator = jsonschema.Draft202012Validator({"$defs": schema["$defs"], "$ref": f"#/$defs/{definition}"})
    for error in sorted(validator.iter_errors(data), key=lambda e: e.json_path):
        field = error.json_path.removeprefix("$").removeprefix(".")
        where = f"{repo_path(path)}: {field}" if field else repo_path(path)
        description = error.schema.get("description")
        # For missing and unknown fields, jsonschema's own wording is already
        # plain. For every other failure it would quote the raw rule, so the
        # rule's description is printed instead.
        if error.validator in ("required", "additionalProperties") or description is None:
            line = f"{where}: {error.message}"
        else:
            got = json.dumps(error.instance, ensure_ascii=False)
            if len(got) > 80:
                got = got[:77] + "..."
            if error.validator == "maxLength":
                got += f" ({len(error.instance)} characters)"
            line = f"{where}: {description} Got: {got}"
        # A blank string breaks both its `pattern` and its `not` rule. They share
        # one description, so the same line would print twice.
        if line not in lines:
            lines.append(line)
    return lines


def download_spdx_list(name):
    """Download and parse one SPDX list file. Try again if a network or HTTP error stops the download."""
    for attempt in range(1, DOWNLOAD_ATTEMPTS + 1):
        try:
            with urllib.request.urlopen(f"{SPDX_URL}/{name}", timeout=60) as response:
                return json.load(response)
        # Network errors, HTTP errors and timeouts are `OSError`. A body cut short
        # raises `IncompleteRead`, an `HTTPException`.
        except (OSError, http.client.HTTPException):
            if attempt == DOWNLOAD_ATTEMPTS:
                raise
            time.sleep(2 * attempt)


def license_problems(expression, licensing, licenses, exceptions):
    """Return the ways an SPDX expression breaks the catalog's license rules."""
    # On some malformed input, license-expression raises errors other than its
    # own `ExpressionError`. A trailing `MIT OR` raises `AttributeError`.
    try:
        info = licensing.validate(expression, strict=True)
        if info.errors:
            return [f"'{expression}' is not a valid SPDX license expression: {'; '.join(info.errors)}"]
        symbols = licensing.license_symbols(licensing.parse(expression), decompose=True)
    except Exception:
        return [f"'{expression}' is not a valid SPDX license expression"]

    lines = []
    # The card shows the expression as written, so it must use SPDX's spelling.
    if info.normalized_expression != expression:
        lines.append(f"write '{expression}' as `{info.normalized_expression}`")
    for symbol in symbols:
        if symbol.is_exception:
            if exceptions[symbol.key]["isDeprecatedLicenseId"]:
                lines.append(f"'{symbol.key}' is a deprecated SPDX exception")
            continue
        details = licenses[symbol.key]
        if details["isDeprecatedLicenseId"]:
            lines.append(f"'{symbol.key}' is a deprecated SPDX license ID. Use its current ID from https://spdx.org/licenses/")
        if not details.get("isOsiApproved", False):
            lines.append(f"'{symbol.key}' is not an OSI-approved license")
    return lines


def print_problems(problems):
    """Print each problem on its own line, then how many there were."""
    print("\n".join(problems), file=sys.stderr)
    noun = "problem" if len(problems) == 1 else "problems"
    print(f"{len(problems)} {noun} found in {repo_path(LIBRARIES)}.", file=sys.stderr)


def main():
    schema_path = LIBRARIES / "schema.json"
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    jsonschema.Draft202012Validator.check_schema(schema)

    try:
        licenses = {item["licenseId"]: item for item in download_spdx_list("licenses.json")["licenses"]}
        exceptions = {item["licenseExceptionId"]: item for item in download_spdx_list("exceptions.json")["exceptions"]}
    except (OSError, http.client.HTTPException) as error:
        print(
            f"Could not download the SPDX License List {SPDX_VERSION} from {SPDX_URL} "
            f"in {DOWNLOAD_ATTEMPTS} attempts: {error}",
            file=sys.stderr,
        )
        return 1
    # Only SPDX IDs are known symbols, so unknown IDs and `LicenseRef-*` are rejected.
    licensing = Licensing(
        [LicenseSymbol(key) for key in licenses]
        + [LicenseSymbol(key, is_exception=True) for key in exceptions]
    )

    problems = []

    # `manifest.json` must be valid JSON and match its schema.
    manifest_path = LIBRARIES / "manifest.json"
    manifest = load_json(manifest_path, problems)
    if manifest is not INVALID:
        problems += schema_problems(manifest_path, manifest, schema, "manifest")
    if problems:
        # Without a usable manifest there is no list of entries to check.
        print_problems(problems)
        return 1

    # Each listed path must appear once, have the form `GROUP/NAME.json` and point at an existing file.
    entries = []  # (group, path)
    seen = set()
    for group in GROUPS:
        where = f"{repo_path(manifest_path)}: {group}"
        for rel in manifest[group]:
            if rel in seen:
                problems.append(f"{where}: '{rel}' is listed more than once")
                continue
            seen.add(rel)
            # Checking the whole path rules out subdirectories, other
            # extensions and aliases such as `clients/./x.json`.
            if not re.fullmatch(f"{group}/{FILE_NAME}", rel):
                problems.append(
                    f"{where}: '{rel}' must be `{group}/NAME.json`. `NAME` is lowercase letters "
                    "and digits joined by single hyphens, such as `valkey-glide-python`."
                )
                continue
            path = LIBRARIES / rel
            if not path.is_file():
                problems.append(f"{where}: '{rel}' does not exist")
                continue
            entries.append((group, path))

    # Every file in the group directories must be listed in the manifest.
    for group in GROUPS:
        for path in sorted((LIBRARIES / group).rglob("*")):
            # Finder adds `.DS_Store` files to folders, and `.gitignore` keeps them
            # out of the repo.
            if not path.is_file() or path.name == ".DS_Store":
                continue
            if path.relative_to(LIBRARIES).as_posix() not in seen:
                problems.append(f"{repo_path(path)}: is not listed in {repo_path(manifest_path)}")

    # Check each listed entry: the schema first, then the rules that need other files or the SPDX list.
    names = {}
    for group, path in entries:
        entry = load_json(path, problems)
        if entry is INVALID:
            continue
        problems += schema_problems(path, entry, schema, DEFINITION_FOR_GROUP[group])
        if not isinstance(entry, dict):
            continue

        name = entry.get("name")
        if isinstance(name, str) and name.strip():
            key = name.casefold()
            if key in names:
                problems.append(
                    f"{repo_path(path)}: name: '{name}' is already used by {repo_path(names[key])}. Names must be unique, ignoring case."
                )
            else:
                names[key] = path

        expression = entry.get("license")
        if isinstance(expression, str) and expression.strip():
            for line in license_problems(expression, licensing, licenses, exceptions):
                problems.append(f"{repo_path(path)}: license: {line}")

    # metadata.json must describe exactly the feature keys the schema defines.
    metadata_path = LIBRARIES / "metadata.json"
    metadata = load_json(metadata_path, problems)
    if metadata is not INVALID:
        metadata_problems = schema_problems(metadata_path, metadata, schema, "metadata")
        problems += metadata_problems
        if not metadata_problems:
            feature_keys = list(schema["$defs"]["client"]["properties"]["features"]["properties"])
            where = f"{repo_path(metadata_path)}: featureDescriptions"
            described = [item["key"] for item in metadata["featureDescriptions"]]
            for key in sorted({key for key in described if described.count(key) > 1}):
                problems.append(f"{where}: '{key}' is listed more than once")
            for key in feature_keys:
                if key not in described:
                    problems.append(f"{where}: has no entry for the feature key `{key}`")
            for key in sorted(set(described) - set(feature_keys)):
                problems.append(f"{where}: '{key}' is not a feature key in {repo_path(schema_path)}")

    if problems:
        print_problems(problems)
        return 1
    print(f"{repo_path(LIBRARIES)}: {len(entries)} entries pass {repo_path(schema_path)} and SPDX License List {SPDX_VERSION} checks.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
