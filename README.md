# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
npx sv@1.1.1 create --template minimal --types ts --add prettier eslint playwright="demo:yes" tailwindcss="plugins:typography,forms" --install npm liberating-spaces
```

## Adding features

Add features to your project with `sv add`:

```sh
npx sv add
```

For example, to add Tailwind CSS:

```sh
npx sv add tailwindcss
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

## Mapbox and Firebase setup

Copy `.env.example` to `.env` and set `MAPBOX_API_KEY`, `FIREBASE_API_KEY`, and `FIREBASE_PROJECT_ID`. The Firebase values are public web configuration; restrict the API key to your app domains in Google Cloud.

In Firebase, enable Email/Password under Authentication and create an editor account. Deploy the rules in `firestore.rules` to Cloud Firestore. The map results editor is at the bottom of the place list; signed-in editors can add and update documents in the `mapResults` collection. Map results refresh from Firestore every five seconds.

Timeline entries are in `src/components/timeline-data.js`. Add entries using the same `date`, `label`, and `description` fields.

## Convert the map CSV to GeoJSON

The source spreadsheet export is `src/lib/assets/updated lakestalignment.csv`. After adding or editing rows, regenerate GeoJSON with:

```sh
npm run csv-to-geojson -- "src/lib/assets/updated lakestalignment.csv" "src/lib/assets/Lake Street Art Map.geojson"
```

The converter reads the `properties.*` fields and `geometry.longitude` / `geometry.latitude` columns, writing coordinates in GeoJSON order (`[longitude, latitude]`). Rows without valid coordinates are skipped and reported. You can provide any CSV and output path; when the output path is omitted, it writes a `.geojson` file next to the CSV. The conversion helper is also exported as `csvToGeoJson` from `scripts/csv-to-geojson.js` for reuse in Node code.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
