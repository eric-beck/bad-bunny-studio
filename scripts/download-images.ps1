# download-images.ps1
# Downloads all lh3.googleusercontent.com images used in HTML files,
# saves them to /assets/images/, and rewrites src attributes in-place.

$rootDir = "d:\Projects\bad-bunny-studio"
$imgDir  = Join-Path $rootDir "assets\images"

if (-not (Test-Path $imgDir)) {
    New-Item -ItemType Directory -Path $imgDir | Out-Null
    Write-Host "Created: assets/images/"
}

# Collect all HTML files
$htmlFiles = Get-ChildItem -Recurse -Filter "*.html" $rootDir

# Track URL -> relative-path mapping to avoid re-downloading duplicates
$urlMap = @{}
$counter = 1

foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $matches  = [regex]::Matches($content, 'src="(https://lh3\.googleusercontent\.com[^"]+)"')

    foreach ($m in $matches) {
        $url = $m.Groups[1].Value
        if (-not $urlMap.ContainsKey($url)) {
            $filename = "img-$($counter.ToString('D3')).jpg"
            $destPath = Join-Path $imgDir $filename

            Write-Host "[$counter] Downloading -> assets/images/$filename"
            try {
                Invoke-WebRequest -Uri $url -OutFile $destPath -UseBasicParsing -TimeoutSec 30
                $urlMap[$url] = "assets/images/$filename"
                $counter++
            } catch {
                Write-Warning "  FAILED: $($_.Exception.Message)"
            }
        }
    }
}

Write-Host "`n--- Rewriting HTML files ---"

foreach ($file in $htmlFiles) {
    $content  = Get-Content $file.FullName -Raw -Encoding UTF8
    $modified = $false

    foreach ($url in $urlMap.Keys) {
        if ($content.Contains($url)) {
            # Calculate depth of this file relative to root
            $fileRelPath = $file.FullName.Substring($rootDir.Length + 1)
            $depth       = ($fileRelPath.Split('\').Count - 1)
            $prefix      = "../" * $depth

            $localSrc = $prefix + $urlMap[$url].Replace('\', '/')
            $content  = $content.Replace($url, $localSrc)
            $modified = $true
        }
    }

    if ($modified) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        $relFile = $file.FullName.Substring($rootDir.Length + 1)
        Write-Host "  Updated: $relFile"
    }
}

Write-Host "`nDone. $($urlMap.Count) unique images downloaded and paths rewritten."
