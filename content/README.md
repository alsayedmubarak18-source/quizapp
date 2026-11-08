# content/

High-Yield notes and MEQ practice for each lecture, as `content/<lecture-key>.json`.
`content/index.json` lists which lectures have content: `{"<key>": {"hy": true, "meq": 10}}`.

```json
{
  "k": "research-types-of-data",
  "title": "Types of Statistical Data",
  "sections": [ { "h": "Heading", "p": "optional text", "items": ["bullet with **bold**"],
                  "table": { "head": ["Col 1", "Col 2"], "rows": [["a", "b"]] } } ],
  "meq": [ { "q": "Question", "a": ["answer line 1", "answer line 2"] } ]
}
```
The lecture key is the same `k` used in `curriculum.js` (`CURRICULUM` or `COURSES`). No Firebase step is needed: add the file, add the key to `index.json`, push.
