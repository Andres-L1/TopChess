# Deployment Update

The fix for mobile authentication has been deployed. The issue where users are asked to log in again after a redirect is likely due to the production domain (`andres-l1.github.io`) not being listed in the **Authorized Domains** section of your Firebase Authentication settings.

## Steps to Fix:
1.  Go to **Firebase Console > Authentication > Settings > Authorized Domains**.
2.  Add `andres-l1.github.io` to the list.
3.  Ensure `localhost` is also present.

If the domain is missing, Google Login redirects back but fails silently due to unauthorized origin, causing the "Login" button to reappear.

I have also updated `firebase.ts` to enforce `browserLocalPersistence` which helps mobile browsers maintain sessions.

Please verify the deployment at: https://Andres-L1.github.io/TopChess
