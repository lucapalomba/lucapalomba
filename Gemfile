source "https://rubygems.org"

# Hello! This is where you manage your Ruby gems.
# GitHub Pages provides a gem to ensure your local environment matches production.
gem "github-pages", group: :jekyll_plugins

# If you have any other plugins, put them here!
group :jekyll_plugins do
  gem "jekyll-feed"
  gem "jekyll-seo-tag"
  gem "jekyll-sitemap"
  gem "jekyll-minifier"
end

# Not used directly by the site. json arrives through jekyll-minifier ->
# json-minify, whose only constraint is the loose `json (> 0)`, so with no
# ceiling a re-resolution happily takes json 3.x. json 3 dropped the
# `create_additions` keyword that htmlcompressor -- also a jekyll-minifier
# dependency -- passes to JSON.parse, which kills `bundle exec jekyll build`
# inside compress_javascript. The lockfile already resolved to 2.x, so this
# changes nothing at runtime; it only stops the failure from recurring.
# Remove once jekyll-minifier can move to 0.2.x, which swaps the JS compressor
# for terser. That is blocked: 0.2.x requires jekyll ~> 4.0, while github-pages
# pins jekyll 3.10.0.
gem "json", "< 3"

group :test do
  gem "html-proofer"
end

# Windows specific performance tweak
# gem "wdm", "~> 0.1.1", :platforms => [:mingw, :x64_mingw, :mswin]
