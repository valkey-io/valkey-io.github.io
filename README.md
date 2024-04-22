# Valkey.io website

This repo contains the source for the valkey.io website (build scripts, template, blog posts, stylesheets, etc.).
The build integrates content from [`valkey-io/valkey-doc`](https://github.com/valkey-io/valkey-doc) and the commands definitions from [`valkey-io/valkey`](https://github.com/valkey-io/valkey-doc) via [Git submodules](https://github.blog/2016-02-01-working-with-submodules/).

## Contributing

We welcome contributions! Please see our [CONTRIBUTING](CONTRIBUTING.md) page to learn more about how to contribute to the website.

## Security

If you discover potential security issues, see the reporting instructions on our [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) page for more information.

## Build Locally

This site is built using Jekyll 4.3.2 with Ruby 3.3.0. Other versions may work, but YMMV.

1. Go to the root of the repo
2. Install [Ruby](https://www.ruby-lang.org/en/) and [RVM](https://rvm.io/) (or some other Ruby version switcher, e.g. [chruby](https://github.com/postmodern/chruby))
3. Install [Jekyll](https://jekyllrb.com/)
4. Install dependencies: `bundle install`
5. Build: `bundle exec jekyll serve` for the local server, `bundle exec jekyll build` for one off builds. Either way, the HTML of the site is generated to `/_site`
6. Point your browser at `http://127.0.0.1:4000/`

## Build with Docker

1. `docker buildx build -t valkey.io .`
1. `docker run --volume="$PWD:/srv:Z" --workdir=/srv -p 3000:4000 valkey.io:latest`
1. Open browser to `http://localhost:3000/`

## License

This project is licensed under the BSD-3-Clause License.
