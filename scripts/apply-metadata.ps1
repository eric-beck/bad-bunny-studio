$metaByPath = @{
  'index.html' = @{ Desc = 'Enter badbunny.studio, an interactive mystery studio featuring secret labs, classified cases, and chaotic plans.'; Keywords = 'badbunny studio, mystery game, interactive lab, puzzle site, classified cases, secret plans' }
  'home.html' = @{ Title='SECRET LAB | badbunny.studio'; Desc = 'Step into the Secret Lab at badbunny.studio to explore missions, clues, and interactive villain-themed tools.'; Keywords = 'secret lab, badbunny studio, mystery hub, puzzle tools, villain lab' }
  'profile.html' = @{ Desc = 'Meet the creator profile behind badbunny.studio and explore links to projects, labs, and story content.'; Keywords = 'profile, badbunny studio, creator, projects, about' }
  'classifieds/index.html' = @{ Desc = 'Browse top secret classifieds and case files in the badbunny.studio investigation archive.'; Keywords = 'classifieds, case files, mystery archive, investigation, badbunny studio' }
  'classifieds/case001.html' = @{ Title='CASE001 - STOLEN DATA | badbunny.studio'; Desc = 'Review CASE001 Stolen Data evidence and decode clues inside the badbunny.studio classified archive.'; Keywords = 'case001, stolen data, classified file, evidence, mystery puzzle' }
  'classifieds/case002.html' = @{ Desc = 'Investigate CASE002 and uncover hidden details in this secret case file from badbunny.studio.'; Keywords = 'case002, secret case file, investigation, hidden clues, badbunny studio' }
  'labs/index.html' = @{ Desc = 'Access the villain lab hub with encoder and decoder tools for ciphers, steganography, and signal analysis.'; Keywords = 'villain lab, encoder, decoder, cipher tools, steganography, spectrogram' }
  'plans/index.html' = @{ Title='THE_PLANS | Overview'; Desc = 'Explore strategic plans, categories, and operations from the badbunny.studio plans section.'; Keywords = 'plans, strategy, operations, categories, badbunny studio' }
  'plans/chaos.html' = @{ Desc = 'Drill into chaos plan details and categorized operation notes inside the badbunny.studio plans archive.'; Keywords = 'chaos plan, operations, categories, strategy page, badbunny studio' }
}

function Get-PrettyName($slug) {
  return (Get-Culture).TextInfo.ToTitleCase(($slug -replace '-', ' '))
}

function Get-CanonicalUrl($relPath) {
  if ($relPath -eq 'index.html') {
    return 'https://badbunny.studio/'
  }

  if ($relPath -match '/index\.html$') {
    return "https://badbunny.studio/$($relPath -replace '/index\.html$', '/')"
  }

  return "https://badbunny.studio/$relPath"
}

$removePatterns = @(
  '<meta\s+name="description"',
  '<meta\s+name="keywords"',
  '<meta\s+name="author"',
  '<meta\s+name="robots"',
  '<meta\s+name="theme-color"',
  '<meta\s+name="twitter:card"',
  '<meta\s+name="twitter:title"',
  '<meta\s+name="twitter:description"',
  '<meta\s+property="og:type"',
  '<meta\s+property="og:site_name"',
  '<meta\s+property="og:locale"',
  '<meta\s+property="og:title"',
  '<meta\s+property="og:description"',
  '<meta\s+property="og:url"',
  '<link\s+rel="canonical"'
)

Get-ChildItem -Path . -Recurse -Filter *.html | ForEach-Object {
  $fullPath = $_.FullName
  $relPath = $fullPath.Substring((Get-Location).Path.Length + 1).Replace('\','/')
  $lines = Get-Content $fullPath

  $filtered = New-Object System.Collections.Generic.List[string]
  foreach ($line in $lines) {
    $shouldRemove = $false
    foreach ($pattern in $removePatterns) {
      if ($line -match $pattern) { $shouldRemove = $true; break }
    }
    if (-not $shouldRemove) { [void]$filtered.Add($line) }
  }

  $titleIndex = -1
  for ($i = 0; $i -lt $filtered.Count; $i++) {
    if ($filtered[$i] -match '<title>.*</title>') { $titleIndex = $i; break }
  }

  $existingTitle = ''
  if ($titleIndex -ge 0) {
    if ($filtered[$titleIndex] -match '<title>(.*?)</title>') { $existingTitle = $matches[1].Trim() }
  }

  $title = $existingTitle
  if ($metaByPath.ContainsKey($relPath) -and $metaByPath[$relPath].ContainsKey('Title')) {
    $title = $metaByPath[$relPath].Title
  } elseif ([string]::IsNullOrWhiteSpace($title) -or $title -eq 'badbunny.studio') {
    if ($relPath -like 'labs/decoders/*.html') {
      $pretty = Get-PrettyName ([System.IO.Path]::GetFileNameWithoutExtension($relPath))
      $title = "$pretty Decoder | VILLAIN SCRAPBOOK"
    } elseif ($relPath -like 'labs/encoders/*.html') {
      $pretty = Get-PrettyName ([System.IO.Path]::GetFileNameWithoutExtension($relPath))
      $title = "$pretty Encoder | VILLAIN SCRAPBOOK"
    } else {
      $title = 'badbunny.studio | Mystery Hub'
    }
  }

  if ($titleIndex -ge 0) {
    $filtered[$titleIndex] = "    <title>$title</title>"
  } else {
    $viewportIndex = -1
    for ($i = 0; $i -lt $filtered.Count; $i++) {
      if ($filtered[$i] -match 'name="viewport"') { $viewportIndex = $i; break }
    }
    if ($viewportIndex -ge 0) {
      $filtered.Insert($viewportIndex + 1, "    <title>$title</title>")
      $titleIndex = $viewportIndex + 1
    }
  }

  $desc = ''
  $keywords = ''
  if ($metaByPath.ContainsKey($relPath)) {
    $desc = $metaByPath[$relPath].Desc
    $keywords = $metaByPath[$relPath].Keywords
  } elseif ($relPath -like 'labs/decoders/*.html') {
    $pretty = Get-PrettyName ([System.IO.Path]::GetFileNameWithoutExtension($relPath))
    $prettyLower = $pretty.ToLowerInvariant()
    $desc = "Decode $prettyLower messages with this interactive decoder tool in the badbunny.studio villain lab."
    $keywords = "$prettyLower decoder, decode $prettyLower, villain lab, cipher tool, badbunny studio"
  } elseif ($relPath -like 'labs/encoders/*.html') {
    $pretty = Get-PrettyName ([System.IO.Path]::GetFileNameWithoutExtension($relPath))
    $prettyLower = $pretty.ToLowerInvariant()
    $desc = "Encode secret messages using the $prettyLower encoder tool in the badbunny.studio villain lab."
    $keywords = "$prettyLower encoder, encode $prettyLower, villain lab, cipher tool, badbunny studio"
  } else {
    $desc = "Explore the $title page on badbunny.studio."
    $keywords = 'badbunny studio, mystery, puzzle, interactive'
  }

  $canonical = Get-CanonicalUrl $relPath
  $metaLines = @(
    "    <meta name=`"description`" content=`"$desc`" />",
    "    <meta name=`"keywords`" content=`"$keywords`" />",
    "    <meta name=`"author`" content=`"badbunny.studio`" />",
    "    <meta name=`"robots`" content=`"index, follow`" />",
    "    <meta name=`"theme-color`" content=`"#c00014`" />",
    "    <link rel=`"canonical`" href=`"$canonical`" />",
    "    <meta property=`"og:type`" content=`"website`" />",
    "    <meta property=`"og:site_name`" content=`"badbunny.studio`" />",
    "    <meta property=`"og:locale`" content=`"en_US`" />",
    "    <meta property=`"og:title`" content=`"$title`" />",
    "    <meta property=`"og:description`" content=`"$desc`" />",
    "    <meta property=`"og:url`" content=`"$canonical`" />",
    "    <meta name=`"twitter:card`" content=`"summary`" />",
    "    <meta name=`"twitter:title`" content=`"$title`" />",
    "    <meta name=`"twitter:description`" content=`"$desc`" />"
  )

  if ($titleIndex -ge 0) {
    for ($m = $metaLines.Count - 1; $m -ge 0; $m--) {
      $filtered.Insert($titleIndex + 1, $metaLines[$m])
    }
  }

  Set-Content -Path $fullPath -Value $filtered -Encoding utf8
}

Write-Output 'Metadata updated in all HTML files.'
