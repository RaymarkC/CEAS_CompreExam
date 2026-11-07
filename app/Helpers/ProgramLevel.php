<?php

namespace App\Helpers;

class ProgramLevel
{
    /**
     * Get the program level ("Masteral" or "Doctorate") based on the program name or code.
     */
    public static function getLevel(?string $program): string
    {
        if (! $program) {
            return 'Masteral';
        }

        $p = strtolower(trim(preg_replace('/\s+/', ' ', $program)));

        // Match degree words or whole abbreviations; "dm" inside "administration" is not a doctorate.
        if (preg_match('/\\bdoctor(?:al|ate)?\\b|\\b(?:ph\\.?d\\.?|ed\\.?d\\.?|d\\.?m\\.?|dba)\\b/i', $p)) {
            return 'Doctorate';
        }

        // Fallback by leading letter D- vs M-
        if (preg_match('/^(d[.\-\s]|doctor)/', $p)) {
            return 'Doctorate';
        }

        return 'Masteral';
    }
}
