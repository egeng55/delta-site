# Live Domain Eval Result

Timestamp: 2026-06-22T23:16:58.734Z

## Summary

- Backend URL: `http://127.0.0.1:8000/behavioral-os/domains`
- Expected domain: `late_caffeine`
- Status: `skipped`
- Classification: `backend_unavailable`
- Reason: Backend unavailable: fetch failed
- Token present: `no`
- Token value stored: `false`
- Request headers stored: `false`
- Sensitive payload stored: `false`

## Coverage

- domain_metadata: `skipped` - live endpoint was unavailable or protected before assertions
- event_taxonomy_metadata: `skipped` - live endpoint was unavailable or protected before assertions
- feedback_policy_metadata: `skipped` - live endpoint was unavailable or protected before assertions
- capability_matrix_metadata: `skipped` - live endpoint was unavailable or protected before assertions

## Assertions

- No assertions were checked because the live endpoint was unavailable or protected.

## Side Effects

- Services started: `no`
- LLM calls: `no`
- Browser automation: `no`
- File mutations outside this report: `no`
- Supabase mutation: `no`
- Mic: `no`
- TTS: `no`
- Notifications: `no`
- Memory writes: `no`

## Next Recommended Command

```bash
Start the local backend, then rerun npm run agent:eval:live -- --backend-url http://127.0.0.1:8000.
```

## Notes

- This report is local evidence only; it is not a CI gate.
- Live evals remain optional and are not part of default deterministic evals.
- Token values, request headers, and sensitive response payloads are intentionally omitted.
