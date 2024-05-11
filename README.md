# Valkey.io website

This repo contains the source for the valkey.io website (build scripts, template, blog posts, stylesheets, etc.).
The build integrates content from [`valkey-io/valkey-doc`](https://github.com/valkey-io/valkey-doc) and the commands definitions from [`valkey-io/valkey`](https://github.com/valkey-io/valkey-doc) via [Git submodules](https://github.blog/2016-02-01-working-with-submodules/).

## Contributing

We welcome contributions! Please see our [CONTRIBUTING](CONTRIBUTING.md) page to learn more about how to contribute to the website.

## Security

If you discover potential security issues, see the reporting instructions on our [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) page for more information.

## Build Locally

This site is built with [Zola](https://www.getzola.org/).

Follow these steps to build the site locally:

1. [Install Zola](https://www.getzola.org/documentation/getting-started/installation/).
2. Switch to the directory with your fork of this repo.
3. Run `zola serve`

Open your browser to `http://127.0.0.1:1111/`

**By default, the site will build without documentation topics nor command reference.**
This content is stored within the `valkey-io/valkey-doc` and `valkey-io/valkey` repos respectively.

In the `/build/` directory there are two helper scripts.
These script create symbolic links to the `valkey-io/valkey-doc` and `valkey-io/valkey` repos as well as create a series of empty stub files that tell Zola to create a file.

### Building the documentation topics

Let's say that this repo and your local copy of `valkey-io/valkey-doc` reside in the same directory.
From the root directory of this repo run:

```shell
./build/init-topics.sh ../valkey-doc/topics 
```

Then, restart Zola.
Point your browser at `http://127.0.0.1:1111/docs/topics/` and you should see the fully populated list of topics.
All files created in this process are ignored by git.
Commit your changes to your local copy of `valkey-io/valkey-doc`.

### Building the command reference

Let's say that this repo and your local copy of `valkey-io/valkey-doc` and `valkey-io/valkey` reside in the same directories.
From the root directory of this repo run:

```shell
./build/init-commands.sh ../valkey-doc/topics ../valkey/src/commands
```

Then, restart Zola.
Point your browser at `http://127.0.0.1:1111/commands/` and you should see the fully populated list of topics.
All files created in this process are ignored by git.
Commit your changes to your local copy of `valkey-io/valkey-doc` for description changes and `valkey-io/valkey` for command JSON changes (if you have any).

## License

This project is licensed under the BSD-3-Clause License.
