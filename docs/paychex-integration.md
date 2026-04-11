# Paychex Integration

SSP Command Center now syncs completed associate timecards into Paychex on the server side.

## Environment Variables

- `PAYCHEX_API_CLIENT_ID`
- `PAYCHEX_API_CLIENT_SECRET`
- `PAYCHEX_COMPANY_ID`
- `PAYCHEX_CLIENT_DISPLAY_ID`
- `PAYCHEX_EARNING_COMPONENT_ID`
- `PAYCHEX_EARNING_COMPONENT_NAME`

Use either `PAYCHEX_COMPANY_ID` or `PAYCHEX_CLIENT_DISPLAY_ID`. If both are present, `PAYCHEX_COMPANY_ID` wins.

## Sync Flow

1. Authenticate with `POST /auth/oauth/v2/token`.
2. Resolve the linked Paychex company.
3. Find the active pay period.
4. Resolve the earnings pay component used for regular hourly work.
5. Match SSP associates to Paychex workers by worker ID, employee ID, clock ID, email, or exact full name.
6. Post completed SSP timecards into Paychex:
   - create a worker check if one does not exist for the current pay period
   - otherwise append a check component to the existing check

## Local Endpoints

- `GET /api/paychex/status`
- `POST /api/paychex/sync`
- `POST /api/paychex/client-access`

## Notes

- Paychex remains the payroll system of record.
- SSP Command only sends completed, unsynced clocked hours.
- If Paychex worker mapping is ambiguous, the sync returns a clear action item instead of silently guessing.
