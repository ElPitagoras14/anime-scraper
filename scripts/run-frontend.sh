#!/bin/bash
unset NEXT_PUBLIC_BACKEND_URL
unset NEXT_PUBLIC_SERVER_BACKEND_URL
unset NEXTAUTH_URL
unset AUTH_SECRET

cd frontend
npm run dev
