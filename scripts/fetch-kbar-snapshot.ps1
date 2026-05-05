$ErrorActionPreference = "Stop"

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$dataDir = Join-Path $root "data"
New-Item -ItemType Directory -Force -Path $dataDir | Out-Null

$stocks = @(
    @{ id = "2330"; suffix = "TW" },
    @{ id = "3491"; suffix = "TWO" },
    @{ id = "2327"; suffix = "TW" },
    @{ id = "6442"; suffix = "TW" },
    @{ id = "3036"; suffix = "TW" }
)

function Round-Nullable($value) {
    if ($null -eq $value) { return $null }
    return [Math]::Round([double]$value, 2)
}

$series = @{}

foreach ($stock in $stocks) {
    $sid = [string]$stock["id"]
    $suffix = [string]$stock["suffix"]
    $symbol = "$sid.$suffix"
    $url = "https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=6mo&interval=1d"
    try {
        $res = Invoke-RestMethod -Uri $url -Headers @{ "User-Agent" = "Mozilla/5.0"; "Cache-Control" = "no-cache" } -TimeoutSec 30
        $result = $res.chart.result[0]
        $timestamps = @($result.timestamp)
        $quote = $result.indicators.quote[0]
        $rows = New-Object System.Collections.Generic.List[object]

        for ($i = 0; $i -lt $timestamps.Count; $i++) {
            $close = $quote.close[$i]
            if ($null -eq $close) { continue }
            $date = ([DateTimeOffset]::FromUnixTimeSeconds([int64]$timestamps[$i])).ToOffset([TimeSpan]::FromHours(8)).ToString("yyyy-MM-dd")
            $rows.Add([pscustomobject]@{
                date = $date
                open = Round-Nullable $quote.open[$i]
                high = Round-Nullable $quote.high[$i]
                low = Round-Nullable $quote.low[$i]
                close = Round-Nullable $quote.close[$i]
                volume = if ($null -eq $quote.volume[$i]) { 0 } else { [int64]$quote.volume[$i] }
            })
        }

        $latestDate = $null
        if ($rows.Count -gt 0) {
            $lastIndex = [int]($rows.Count - 1)
            $latestDate = $rows[$lastIndex].date
        }
        $rowArray = $rows.ToArray()

        $series[$sid] = [pscustomobject]@{
            id = $sid
            symbol = $symbol
            source = $url
            count = $rows.Count
            latestDate = $latestDate
            rows = $rowArray
        }
        Write-Host "Fetched $symbol rows=$($rows.Count)"
    } catch {
        Write-Warning "Failed to fetch $symbol : $($_.Exception.Message) at line $($_.InvocationInfo.ScriptLineNumber)"
    }
}

$snapshot = [pscustomobject]@{
    generatedAt = (Get-Date).ToString("yyyy-MM-ddTHH:mm:sszzz")
    source = "Yahoo Finance chart public endpoint"
    range = "6mo"
    interval = "1d"
    series = $series
}

$outPath = Join-Path $dataDir "kbar-snapshot.json"
$json = $snapshot | ConvertTo-Json -Depth 12
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($outPath, $json, $utf8NoBom)
Write-Host "Wrote $outPath"
