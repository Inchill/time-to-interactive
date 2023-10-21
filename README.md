# Time to Interactive

Easily measure performance metrics of time to interactive in JavaScript.

## Usage

**Install**

```shell
npm i @inchill/time-to-interactive
```

or

```shell
yarn add @inchill/time-to-interactive
```

or

```shell
pnpm add @inchill/time-to-interactive
```

After installing it's simple to use:

```js
import { onTTI } from '@inchill/time-to-interactive';

onTTI(res => console.log(res)); // output =>

// {
//     "name": "TTI",
//     "value": 710.2000000001863,
//     "rating": "good",
//     "id": "v3-1697879873463-1156317372000"
// }
```

## Browser Support

The `time-to-interactive` code will run without error in all major browsers as well as Internet Explorer back to version 11. So, `onTTI` is currently only available in Chromium-based browsers (e.g. Chrome, Edge, Opera, Samsung Internet).

## License

[MIT](/LICENSE)
