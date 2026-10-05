<?php
declare(strict_types=1);
/** POST /api/admin/logout.php — clears the admin cookie in this browser. */
require dirname(__DIR__) . '/_lib/bootstrap.php';

hvm_require_method('POST');
hvm_require_same_origin();
hvm_end_admin_session();
hvm_ok();
