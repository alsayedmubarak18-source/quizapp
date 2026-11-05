# quizzes/

كل كويز ملف JSON هنا، ويتضاف اسمه في `index.json` (قايمة أسماء الملفات).
المدرّس بيضغط «تحميل الكويزات الجاهزة» في لوحته فتتضاف كلها لـ Firebase (الموجود بنفس `id` بيتحدّث).

```json
{
  "id": "w11-biochem-minerals-1",          // ثابت وفريد
  "title": "Minerals Homeostasis: High-yield",
  "lang": "en",
  "lec": "w11-biochemistry-minerals-homeostasis",  // مفتاح المحاضرة من curriculum.js (أو block-2)
  "questions": [
    { "q": "...", "correct": 0,
      "options": [ { "t": "choice A", "e": "why right/wrong" }, { "t": "...", "e": "..." } ] }
  ]
}
```
