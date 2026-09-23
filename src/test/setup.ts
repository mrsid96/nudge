import '@testing-library/jest-dom'

// fake-indexeddb is a TEST-ONLY polyfill so Dexie works in Node/jsdom.
// Production uses the browser's native IndexedDB — never bundled.
import 'fake-indexeddb/auto'
