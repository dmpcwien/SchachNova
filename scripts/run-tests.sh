#!/usr/bin/env bash
# Run all regression tests, including newly added ones, and report every failure.
set -euo pipefail
cd "$(dirname "$0")/.."
failed=0
for test_file in tests/*.test.cjs; do
  echo "::group::${test_file}"
  if node "$test_file"; then
    echo "PASS: ${test_file}"
  else
    echo "::error::FAIL: ${test_file}"
    failed=1
  fi
  echo "::endgroup::"
done
if (( failed )); then
  echo "::error::One or more regression tests failed"
  exit 1
fi
echo "All SchachNova regression tests passed"
