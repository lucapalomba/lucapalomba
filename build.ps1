$sourceDir = $PSScriptRoot
$distDir = Join-Path $sourceDir "dist"

Write-Host "Starting build process..."

# Clean dist
if (Test-Path $distDir) {
    Write-Host "Cleaning dist folder..."
    Remove-Item -Path $distDir -Recurse -Force
}
New-Item -ItemType Directory -Path $distDir | Out-Null

# Helper to minify HTML (Basic)
function Minify-HTML ($content) {
    $content = $content -replace '<!--[\s\S]*?-->', '' # Remove comments
    $content = $content -replace '\s+', ' '           # Collapse whitespace
    $content = $content -replace '>\s+<', '><'        # Remove whitespace between tags
    return $content.Trim()
}

# Helper to minify CSS (Robust)
function Minify-CSS ($content) {
    # Pattern matches strings ("...", '...') OR comments (/*...*/)
    $pattern = '("(\.|[^"])*?"|''(\.|[^''])*?'')|(/\*[\s\S]*?\*/)'
    
    $content = [System.Text.RegularExpressions.Regex]::Replace($content, $pattern, { param($match)
            if ($match.Groups[1].Success) { return $match.Value } # It's a string, keep it
            return "" # It's a comment, remove it
        })

    $content = $content -replace '\s*([{:;,])\s*', '$1' # Remove whitespace around separators
    $content = $content -replace '\s+', ' '           # Collapse remaining whitespace
    return $content.Trim()
}

# Helper to minify JS (Robust)
function Minify-JS ($content) {
    # Pattern matches strings ("...", '...', `...`) OR comments (//..., /*...*/)
    # Note: Backtick string regex might need adjustment if complex nesting, but good for basic cases.
    $pattern = '("(\.|[^"])*?"|''(\.|[^''])*?''|`(\.|[^`])*?`)|(//.*$|/\*[\s\S]*?\*/)'
    
    $options = [System.Text.RegularExpressions.RegexOptions]::Multiline

    $content = [System.Text.RegularExpressions.Regex]::Replace($content, $pattern, { param($match)
            if ($match.Groups[1].Success) { return $match.Value } # It's a string, keep it
            return "" # It's a comment, remove it
        }, $options)

    $content = $content -replace '\s+', ' '           # Collapse whitespace
    return $content.Trim()
}

# Copy and Minify HTML
Write-Host "Processing HTML files..."
Get-ChildItem -Path $sourceDir -Filter "*.html" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $minified = Minify-HTML $content
    $destPath = Join-Path $distDir $_.Name
    Set-Content -Path $destPath -Value $minified -Encoding UTF8
}

# Copy and Minify CSS
Write-Host "Processing CSS files..."
$cssDir = Join-Path $distDir "styles"
New-Item -ItemType Directory -Path $cssDir | Out-Null
Get-ChildItem -Path (Join-Path $sourceDir "styles") -Filter "*.css" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $minified = Minify-CSS $content
    $destPath = Join-Path $cssDir $_.Name
    Set-Content -Path $destPath -Value $minified -Encoding UTF8
}

# Copy and Minify JS
Write-Host "Processing JS files..."
$jsDir = Join-Path $distDir "js"
New-Item -ItemType Directory -Path $jsDir | Out-Null
Get-ChildItem -Path (Join-Path $sourceDir "js") -Filter "*.js" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $minified = Minify-JS $content
    $destPath = Join-Path $jsDir $_.Name
    Set-Content -Path $destPath -Value $minified -Encoding UTF8
}

# Copy Assets
Write-Host "Copying assets..."
if (Test-Path (Join-Path $sourceDir "translations.json")) {
    Copy-Item -Path (Join-Path $sourceDir "translations.json") -Destination $distDir
}
if (Test-Path (Join-Path $sourceDir "manifest.webmanifest")) {
    Copy-Item -Path (Join-Path $sourceDir "manifest.webmanifest") -Destination $distDir
}

Write-Host "Build completed successfully!"
