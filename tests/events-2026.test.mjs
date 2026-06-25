import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();

const expectedEvents = [
  ["laracon-india-2026.md", "Laracon India 2026", "2026-01-31", "third-party"],
  ["kcd-guadalajara-2026.md", "KCD Guadalajara 2026", "2026-04-18", "third-party"],
  ["scale-2026.md", "SCaLE 23x 2026", "2026-03-05", "third-party"],
  ["kcd-beijing-2026.md", "KCD Beijing + vLLM 2026", "2026-03-21", "third-party"],
  ["kcd-new-york-2026.md", "KCD New York 2026", "2026-06-10", "third-party"],
  ["ossummit-india-2026.md", "Open Source Summit India 2026", "2026-06-16", "third-party"],
  ["kcd-kuala-lumpur-2026.md", "KCD Kuala Lumpur 2026", "2026-06-27", "third-party"],
  ["kcd-lima-2026.md", "KCD Lima 2026", "2026-07-18", "third-party"],
  ["ossummit-korea-2026.md", "Open Source Summit Korea 2026", "2026-08-11", "third-party"],
  ["pycon-cameroon-2026.md", "PyCon Cameroon 2026", "2026-09-17", "third-party"],
  ["tdc-sao-paulo-2026.md", "TDC Sao Paulo 2026", "2026-09-23", "third-party"],
  ["nerdearla-ar-2026.md", "Nerdearla Argentina 2026", "2026-09-22", "third-party"],
  ["all-things-open-2026.md", "All Things Open 2026", "2026-10-19", "third-party"],
  ["mqsummit-2026.md", "MQ Summit 2026", "2026-10-21", "third-party"],
  ["pybeach-2026.md", "PyBeach 2026", "2026-10-24", "third-party"],
  ["nerdearla-mx-2026.md", "Nerdearla Mexico 2026", "2026-11-18", "third-party"],
  ["valkeyconf-2026.md", "ValkeyConf 2026", "2026-10-05", "first-party", "https://events.linuxfoundation.org/valkeyconf/"],
  ["ossummit-europe-2026.md", "Open Source Summit Europe 2026", "2026-10-07", "third-party"],
  ["hack-ncstate-2026.md", "Hack_NCState 2026", "2026-02-14", "meetup-hackathon"],
  ["valkey-react-hyderabad-2026.md", "Valkey x React Hyderabad Meetup", "2026-04-25", "meetup-hackathon"],
  ["cache-cafe-2026.md", "Cache Café", "2026-05-20", "meetup-hackathon", "https://luma.com/7hqby6yi"],
  ["bengaluru-valkey-meetup-2026.md", "From Caching to AI Systems - The First Valkey Meetup Bengaluru", "2026-05-23", "meetup-hackathon", "https://luma.com/r85gjjg8"],
  ["build-beyond-limits-hyderabad-2026.md", "Build Beyond Limits Hackathon - Hyderabad", "2026-05-24", "meetup-hackathon"],
  ["delhi-valkey-meetup-2026.md", "From Caching to AI Systems - The First Valkey Meetup Delhi", "2026-06-13", "meetup-hackathon", "https://luma.com/3ru2wb4d"],
  ["chennai-valkey-meetup-2026.md", "From Caching to AI & IIoT Systems - The First Valkey Meetup Chennai", "2026-06-14", "meetup-hackathon", "https://luma.com/tsuzpa4r"],
  ["valkey-seattle-systems-meetup-2026.md", "Valkey x Seattle Systems Meetup", "2026-06-25", "meetup-hackathon", "https://www.meetup.com/seattle-valkey/events/314853351/"],
];

const expectedEventEndDates = new Map([
  ["laracon-india-2026.md", "2026-02-01"],
  ["scale-2026.md", "2026-03-08"],
  ["ossummit-na-2026.md", "2026-05-20"],
  ["ossummit-india-2026.md", "2026-06-17"],
  ["laracon-us-2026.md", "2026-07-29"],
  ["ossummit-korea-2026.md", "2026-08-12"],
  ["pycon-cameroon-2026.md", "2026-09-19"],
  ["nerdearla-ar-2026.md", "2026-09-26"],
  ["tdc-sao-paulo-2026.md", "2026-09-25"],
  ["ossummit-europe-2026.md", "2026-10-09"],
  ["all-things-open-2026.md", "2026-10-20"],
  ["mqsummit-2026.md", "2026-10-22"],
  ["nerdearla-mx-2026.md", "2026-11-20"],
]);

const removedEvents = [
  ["nyc-valkey-meetup-2026.md", "NYC Valkey Meetup - June 2026"],
  ["pycon-africa-2026.md", "PyCon Africa 2026"],
  ["symfonycon-warsaw-2026.md", "SymfonyCon Warsaw 2026"],
];

const updatedMeetupFiles = [
  "bay-area-opensearch-valkey-meetup-2026.md",
  "seattle-meetup-april-2026.md",
];

function readEventFile(fileName) {
  const filePath = join(repoRoot, "content", "events", fileName);
  assert.ok(existsSync(filePath), `${fileName} should exist`);
  return readFileSync(filePath, "utf8");
}

function frontmatterValue(content, key) {
  const match = content.match(new RegExp(`^${key}\\s*=\\s*"?([^"\\n]+)"?`, "m"));
  assert.ok(match, `missing ${key}`);
  return match[1].trim();
}

for (const [fileName, expectedTitle, expectedDate, expectedType, expectedUrl] of expectedEvents) {
  const content = readEventFile(fileName);
  assert.equal(frontmatterValue(content, "title"), expectedTitle, `${fileName} title`);
  assert.equal(frontmatterValue(content, "date").slice(0, 10), expectedDate, `${fileName} date`);
  assert.equal(frontmatterValue(content, "event_type"), expectedType, `${fileName} event type`);
  assert.match(content, /^location = ".+"/m, `${fileName} should include a location`);
  if (expectedType !== "first-party" || expectedUrl) {
    assert.match(content, /^external_url = ".+"/m, `${fileName} should include an external URL`);
  }
  if (expectedEventEndDates.has(fileName)) {
    assert.equal(
      frontmatterValue(content, "end_date").slice(0, 10),
      expectedEventEndDates.get(fileName),
      `${fileName} end date`,
    );
  }
  if (expectedUrl) {
    assert.equal(frontmatterValue(content, "external_url"), expectedUrl, `${fileName} external URL`);
  }
}

for (const [fileName, expectedEndDate] of expectedEventEndDates) {
  const content = readEventFile(fileName);
  assert.equal(
    frontmatterValue(content, "end_date").slice(0, 10),
    expectedEndDate,
    `${fileName} end date`,
  );
}

for (const [fileName, removedTitle] of removedEvents) {
  const filePath = join(repoRoot, "content", "events", fileName);
  assert.ok(!existsSync(filePath), `${fileName} should be removed`);
  const eventFiles = expectedEvents.map(([expectedFileName]) => readEventFile(expectedFileName));
  assert.ok(!eventFiles.some((content) => content.includes(removedTitle)), `${removedTitle} should not be listed`);
}

for (const fileName of updatedMeetupFiles) {
  const content = readEventFile(fileName);
  assert.equal(frontmatterValue(content, "event_type"), "meetup-hackathon", `${fileName} event type`);
}

const valkeyConfContent = readEventFile("valkeyconf-2026.md");
assert.match(
  valkeyConfContent,
  /https:\/\/events\.linuxfoundation\.org\/valkeyconf\//,
  "ValkeyConf should link to the official website",
);
assert.doesNotMatch(
  valkeyConfContent,
  /website is in progress/i,
  "ValkeyConf should not say the website is in progress after the official site is available",
);

const eventsTemplate = readFileSync(join(repoRoot, "templates", "events.html"), "utf8");
assert.match(eventsTemplate, /legend-dot meetup-hackathon/, "legend should show meetup/hackathon type");
assert.match(eventsTemplate, /Meetup \/ Hackathon/, "cards should label meetup/hackathon events");
assert.match(eventsTemplate, /title="' \+ e\.title \+ '"/, "calendar labels should expose full titles on hover");
assert.match(eventsTemplate, /endDate:/, "template should expose event end dates");
assert.match(eventsTemplate, /page\.extra\.end_date/, "template should read end_date from frontmatter");
assert.match(eventsTemplate, /eventDateKeys/, "calendar should expand multi-day events onto every covered day");
assert.match(eventsTemplate, /eventMonthKeys/, "cards should know every month touched by multi-day events");
assert.match(eventsTemplate, /data-months/, "event cards should expose every covered month");
assert.match(eventsTemplate, /formatDateRange/, "cards should show date ranges for multi-day events");
assert.match(eventsTemplate, /eventEndDate\(e\) < today \? ' past' : ''/, "past cards should be based on event end date");

const eventsStyles = readFileSync(join(repoRoot, "sass", "_valkey.scss"), "utf8");
for (const selector of [
  "&.meetup-hackathon { background-color:",
  "text-overflow: ellipsis;",
  "white-space: nowrap;",
  ".event-card-badge",
]) {
  assert.match(eventsStyles, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `styles should include ${selector}`);
}
