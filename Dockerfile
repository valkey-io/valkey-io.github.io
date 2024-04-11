# Build the Ruby image from source
FROM ruby:3.0 AS ruby-build
RUN apt-get update -qq && apt-get install -y curl build-essential libssl-dev libyaml-dev libreadline-dev zlib1g-dev

# Build the Jekyll site
FROM ruby-build AS jekyll-build

# Set the working directory
WORKDIR /

# Copy the Gemfile and Gemfile.lock into the container
COPY Gemfile Gemfile.lock ./

# Install Jekyll and bundler
RUN gem install bundler jekyll

# Install the dependencies
RUN bundle install

# Copy the Jekyll site code into the container
COPY . .

# Build the Jekyll site
RUN bundle exec jekyll build --incremental --trace

# Copy the Jekyll site
FROM ruby-build
WORKDIR /
COPY --from=jekyll-build / /

# Expose the port for the Jekyll development server
EXPOSE 4000

# Start the Jekyll development server
CMD ["jekyll", "serve", "--host=0.0.0.0", "--force_polling", "--source", "/"]