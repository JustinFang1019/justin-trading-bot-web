$ErrorActionPreference = "Stop"

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$dataDir = Join-Path $root "data"
New-Item -ItemType Directory -Force -Path $dataDir | Out-Null

function To-Number($value) {
    $s = [string]$value
    $s = $s.Replace(",", "").Replace("+", "").Replace("X", "").Trim()
    if ($s -eq "" -or $s -eq "--") { return $null }
    $n = 0.0
    if ([double]::TryParse($s, [ref]$n)) { return $n }
    return $null
}

function To-Int($value) {
    $n = To-Number $value
    if ($null -eq $n) { return 0 }
    return [int64]$n
}

$todayTw = [System.TimeZoneInfo]::ConvertTimeBySystemTimeZoneId((Get-Date), "Taipei Standard Time").ToString("yyyyMMdd")
$cacheBust = [DateTimeOffset]::Now.ToUnixTimeSeconds()
$twseUrl = "https://www.twse.com.tw/exchangeReport/STOCK_DAY_ALL?date=$todayTw&response=json&_=$cacheBust"
$tpexUrl = "https://www.tpex.org.tw/openapi/v1/tpex_mainboard_daily_close_quotes"

$twse = Invoke-RestMethod -Uri $twseUrl -Headers @{ "User-Agent" = "Mozilla/5.0"; "Cache-Control" = "no-cache" } -TimeoutSec 30

$client = New-Object System.Net.WebClient
$client.Headers.Add("User-Agent", "Mozilla/5.0")
$tpexBytes = $client.DownloadData($tpexUrl)
$tpexJson = [System.Text.Encoding]::UTF8.GetString($tpexBytes)
$tpex = $tpexJson | ConvertFrom-Json

$rows = New-Object System.Collections.Generic.List[object]

foreach ($r in $twse.data) {
    $id = [string]$r[0]
    $name = [string]$r[1]
    $close = To-Number $r[7]
    if ($null -eq $close -or $close -le 0) { continue }
    $change = To-Number $r[8]
    $rows.Add([pscustomobject]@{
        id = $id
        name = $name
        market = "twse"
        open = To-Number $r[4]
        high = To-Number $r[5]
        low = To-Number $r[6]
        close = $close
        change = $change
        volumeShares = To-Int $r[2]
        tradeValue = To-Int $r[3]
        trades = To-Int $r[9]
    })
}

foreach ($r in $tpex) {
    $id = [string]$r.SecuritiesCompanyCode
    if (-not $id) { continue }
    $name = [string]$r.CompanyAbbreviation
    if (-not $name) { $name = [string]$r.CompanyName }
    $close = To-Number $r.Close
    if ($null -eq $close -or $close -le 0) { continue }
    $rows.Add([pscustomobject]@{
        id = $id
        name = $name
        market = "tpex"
        open = To-Number $r.Open
        high = To-Number $r.High
        low = To-Number $r.Low
        close = $close
        change = To-Number $r.Change
        volumeShares = To-Int $r.TradingShares
        tradeValue = To-Int $r.TransactionAmount
        trades = To-Int $r.TransactionNumber
    })
}

$watchIds = @("2330", "3491", "2327", "6442", "3036")
$watchlist = $rows | Where-Object { $watchIds -contains $_.id } | Sort-Object id
$activeEtfs = $rows | Where-Object { $_.id -match "^\d{5}A$" -or $_.name -like "*主動*" } | Sort-Object tradeValue -Descending
$topByValue = $rows | Where-Object { $_.id -match "^\d{4}$" } | Sort-Object tradeValue -Descending | Select-Object -First 20

$snapshot = [pscustomobject]@{
    generatedAt = (Get-Date).ToString("yyyy-MM-ddTHH:mm:sszzz")
    marketDate = $twse.date
    twseTitle = $twse.title
    sources = @{
        twse = $twseUrl
        tpex = $tpexUrl
    }
    counts = @{
        all = $rows.Count
        watchlist = @($watchlist).Count
        activeEtfs = @($activeEtfs).Count
    }
    watchlist = @($watchlist)
    activeEtfs = @($activeEtfs | Select-Object -First 30)
    topByValue = @($topByValue)
}

$outPath = Join-Path $dataDir "market-snapshot.json"
$json = $snapshot | ConvertTo-Json -Depth 8
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($outPath, $json, $utf8NoBom)
$jsPath = Join-Path $dataDir "market-snapshot.js"
[System.IO.File]::WriteAllText($jsPath, "window.MARKET_SNAPSHOT = $json;", $utf8NoBom)
Write-Host "Wrote $outPath"
Write-Host "Wrote $jsPath"
Write-Host "Rows: $($rows.Count), Watchlist: $(@($watchlist).Count), Active ETFs: $(@($activeEtfs).Count)"
