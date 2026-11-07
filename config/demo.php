<?php

return [
    'hosted_enabled' => filter_var(env('HOSTED_DEMO_ENABLED', false), FILTER_VALIDATE_BOOLEAN),
    'finance_accounts' => ['finance@uic.edu.ph' => ['role' => 'Finance']],
    'proctor_accounts' => [
        'proctor1@uic.edu.ph' => ['role' => 'Proctor', 'first_name' => 'Demo Proctor', 'last_name' => '1', 'school_id' => 'DEMO-PROCTOR-1'],
        'proctor2@uic.edu.ph' => ['role' => 'Proctor', 'first_name' => 'Demo Proctor', 'last_name' => '2', 'school_id' => 'DEMO-PROCTOR-2'],
        'proctor3@uic.edu.ph' => ['role' => 'Proctor', 'first_name' => 'Demo Proctor', 'last_name' => '3', 'school_id' => 'DEMO-PROCTOR-3'],
        'proctor4@uic.edu.ph' => ['role' => 'Proctor', 'first_name' => 'Demo Proctor', 'last_name' => '4', 'school_id' => 'DEMO-PROCTOR-4'],
        'proctor5@uic.edu.ph' => ['role' => 'Proctor', 'first_name' => 'Demo Proctor', 'last_name' => '5', 'school_id' => 'DEMO-PROCTOR-5'],
    ],
    'accounts' => [
        'student@uic.edu.ph' => ['role' => 'Student', 'first_name' => 'Demo', 'last_name' => 'Student', 'school_id' => 'DEMO-STUDENT'],
        'adviser@uic.edu.ph' => ['role' => 'Adviser', 'first_name' => 'Demo', 'last_name' => 'Adviser', 'school_id' => 'DEMO-ADVISER'],
        'acadcoor@uic.edu.ph' => ['role' => 'Coordinator', 'first_name' => 'Demo', 'last_name' => 'Coordinator', 'school_id' => 'DEMO-COORDINATOR'],
        'aa@uic.edu.ph' => ['role' => 'Administrative Assistant', 'first_name' => 'Demo', 'last_name' => 'Assistant', 'school_id' => 'DEMO-AA'],
        'dean@uic.edu.ph' => ['role' => 'Dean', 'first_name' => 'Demo', 'last_name' => 'Dean', 'school_id' => 'DEMO-DEAN'],
        'registrar@uic.edu.ph' => ['role' => 'Registrar', 'first_name' => 'Demo', 'last_name' => 'Registrar', 'school_id' => 'DEMO-REGISTRAR'],
        'student2@uic.edu.ph' => [
            'role' => 'Student',
            'first_name' => 'Test',
            'last_name' => 'Student Two',
            'school_id' => 'DEMO-STUDENT-2',
        ],
    ],
    'workflow_accounts' => [
        'student@uic.edu.ph' => ['role' => 'Student', 'first_name' => 'Demo', 'last_name' => 'Student', 'school_id' => 'DEMO-WORKFLOW-STUDENT', 'program' => 'Master of Arts in Education'],
        'aa@uic.edu.ph' => ['role' => 'Administrative Assistant', 'first_name' => 'Demo', 'last_name' => 'Assistant', 'school_id' => 'DEMO-WORKFLOW-AA'],
        'coordinator@uic.edu.ph' => ['role' => 'Coordinator', 'first_name' => 'Demo', 'last_name' => 'Coordinator', 'school_id' => 'DEMO-WORKFLOW-COORDINATOR'],
        'registrar@uic.edu.ph' => ['role' => 'Registrar', 'first_name' => 'Demo', 'last_name' => 'Registrar', 'school_id' => 'DEMO-WORKFLOW-REGISTRAR'],
        'dean@uic.edu.ph' => ['role' => 'Dean', 'first_name' => 'Demo', 'last_name' => 'Dean', 'school_id' => 'DEMO-WORKFLOW-DEAN'],
    ],
    'workflow_coordinator_programs' => [
        'coordinator@uic.edu.ph' => ['Master of Arts in Education'],
    ],
];
