# Google Drive in the Studio

Photos can be brought into the Studio straight from the agency's Google Drive:

- **Galleries** (a model's Portfolio and Polaroids, the Contact page's Photos): **Add from Google Drive** under the grid — pick several photos at once; they are added at the end, in the order picked.
- **Single images** (a model's cover, the magazine's cover and pages, the share image, a photo opened from a gallery…): a **From Google Drive** button under the field.

Each person signs in with their Google account the first time. The Studio asks for read-only access to the Drive (scope `drive.readonly`, needed for the picker to show thumbnails); the access stays in that person's browser, and nothing in the Drive is changed.

**Where it opens:** in the folder set in Studio › Site settings › *Google Drive folder* (the folder with that site's models). After the first photos are picked for a model, the window opens in the folder they came from the next time, for that model, in that browser.

It runs on the agency's own Google Cloud project, set up once (about 10 minutes), with the Google account that owns the Drive:

1. [console.cloud.google.com](https://console.cloud.google.com) → create a project, e.g. *INCH Studio*.
2. **APIs & Services → Library**: enable **Google Drive API** and **Google Picker API**.
3. **Google Auth Platform (OAuth consent screen)**: app name *INCH Studio*, the support email; audience **Internal** if the agency is on Google Workspace (only its own accounts, no review by Google), otherwise **External** with the people who upload (e.g. Nir, Anna) added as test users. Data access: add the scope `.../auth/drive.readonly`.
4. **Clients → Create client → Web application**. Authorised JavaScript origins: the site's address(es), e.g. `https://inch-models.com`, `https://www.inch-models.com` (and the Vercel production address). Copy the **Client ID**.
5. **Credentials → Create credentials → API key**. Restrict it: *Application restrictions* → Websites → `https://inch-models.com/*` (and the other addresses); *API restrictions* → Google Picker API. Copy the **API key**.
6. **IAM & Admin → Settings**: copy the **Project number**.
7. In Vercel (project → Settings → Environment Variables, Production), then redeploy:

   | Variable | Value |
   | --- | --- |
   | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | the Client ID |
   | `NEXT_PUBLIC_GOOGLE_API_KEY` | the API key |
   | `NEXT_PUBLIC_GOOGLE_APP_ID` | the Project number |

Until the three are set, the Studio simply shows no Drive buttons.

Code: `src/sanity/drive/` (the picker and download in `google.ts`, the gallery button in `DriveArrayInput.tsx`, the image fields' button in `DriveImageInput.tsx`).
