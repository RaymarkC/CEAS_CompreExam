<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Defense schedule</title>
<style>
body{font:12px Arial,sans-serif;color:#111;margin:24px}h1{font-size:20px}p{line-height:1.5}table{border-collapse:collapse;width:100%;table-layout:fixed}th,td{border:1px solid #ccc;padding:8px;vertical-align:top;overflow-wrap:anywhere;white-space:pre-line}th{background:#eee}.label{width:100px}section{margin-bottom:30px}button{padding:10px 18px;margin-bottom:12px}@page{size:A4 landscape;margin:12mm}@media print{button{display:none}body{margin:0}section{break-after:page}section:last-child{break-after:auto}tr{break-inside:avoid}thead{display:table-header-group}}
</style></head>
<body>
<button onclick="window.print()">Print / Save as PDF</button>
<h1>Graduate School Defense Schedule</h1><p>{{ $from }} to {{ $to }} · Philippine time.<br>Scheduled entries do not establish attendance or payment. Unclassified panelists require review.</p>
@forelse(array_chunk($dates, 5) as $pageDates)
<section><table><thead><tr><th class="label">Time / detail</th>@foreach($pageDates as $date)<th>{{ \Carbon\Carbon::parse($date)->format('M d, Y') }}</th>@endforeach</tr></thead><tbody>
@foreach($slots as $slot)@foreach($kinds as $kind)
<tr><th>{{ $slot ?: 'Unspecified' }}<br>{{ $kind }}</th>@foreach($pageDates as $date)<td>{{ implode("\n\n", $grid[$slot][$date][$kind] ?? []) }}</td>@endforeach</tr>
@endforeach @endforeach
</tbody></table></section>
@empty<p>No scheduled defenses in this date range.</p>@endforelse
</body></html>
