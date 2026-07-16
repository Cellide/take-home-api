# License Considerations

I think Apache 2.0 deserves serious consideration because your project sits in an interesting spot: it's infrastructure for developers, not an end-user application. That's exactly where Apache 2.0 has become very common.
Let's compare them in practical terms.
| Aspect | MIT | Apache 2.0 |
| --- | --- | --- |
| Commercial use | ✅ | ✅ |
| Modify | ✅ | ✅ |
| Redistribute | ✅ | ✅ |
| Closed-source derivatives | ✅ | ✅ |
| Patent grant | ❌ | ✅ |
| Patent retaliation | ❌ | ✅ |
| Requires NOTICE file | ❌ | ✅ |
| Easy to understand | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
So for 95% of users, they're effectively the same. The differences only matter when lawyers get involved.
---
## The big feature: the patent grant
MIT basically says:
> "Here's my software. Do whatever you want."
Apache says:
> "Here's my software, and I also grant you a license to any patents I own that are necessary to use it."
Why does that matter?
Imagine someone contributes a clever scheduling algorithm to your project.
Years later they obtain (or claim to own) a patent covering that technique.
Under MIT, there's no explicit patent license.
Under Apache 2.0, they've already granted one by contributing.
That's why many large companies are much happier contributing to Apache projects.
---
## Patent retaliation
Apache also contains what's called a **patent retaliation clause**.
Suppose Company A contributes code.
Then Company A sues another user of the project over patents relating to the software.
Apache says, in simplified terms:
> "If you start patent litigation over this software, you lose the patent license granted by Apache."
It discourages patent trolling inside the ecosystem.
MIT has nothing similar.
---
## NOTICE
Apache requires preservation of a `NOTICE` file if one exists.
In practice you'll have:
```javascript
LICENSE

NOTICE

README.md
```
The NOTICE file is usually tiny:
```javascript
Take Home API

Copyright (c) 2026 Cellide

Licensed under Apache License 2.0.
```
Many projects never touch it again.
---
## Attribution
People often think Apache requires open-sourcing modifications.
It does **not**.
Someone can fork your project.
Modify everything.
Sell it.
Never publish their changes.
Exactly like MIT.
Apache is still a permissive license.
---
# Why many infrastructure projects choose Apache
Historically you'll find projects like:
- Kubernetes
- Apache Kafka
- Apache Spark
- Apache Airflow
- gRPC
- Envoy
- Helm
using Apache 2.0.
The reason isn't ideology.
It's that companies are much more comfortable investing engineering effort into Apache projects.
---
# Why GitHub projects often use MIT
MIT became popular because it's tiny.
Literally about 170 words.
Developers understand it.
Nobody has to think.
JavaScript especially has a huge MIT culture.
---
# Your situation is a little different
You're not building another npm library.
You're potentially building:
- a benchmark
- a specification
- a long-lived OSS ecosystem
- something companies may adopt internally
That starts looking much more like Kubernetes than like a React utility.
---
# One concern people have
> Will Apache scare away contributors?
In my experience...
No.
Most contributors don't even notice.
They see:
```javascript
Apache 2.0
```
and think
> "Cool, permissive."
They only get nervous around:
- GPL
- LGPL
- AGPL
- SSPL
- BUSL
Apache doesn't have that effect.
---
# What I would do
If I were creating `github.com/Cellide/take-home-api` today, I'd probably do this:
```javascript
LICENSE          (Apache 2.0)

NOTICE

CODE_OF_CONDUCT.md

CONTRIBUTING.md

SECURITY.md

README.md
```
Then add a Developer Certificate of Origin (DCO) instead of asking contributors to sign a Contributor License Agreement (CLA).
Why?
A DCO is lightweight. Contributors simply certify that they have the right to submit their code, usually by signing commits with `Signed-off-by:`. That's the workflow used by projects like the Linux kernel, Kubernetes, and many CNCF projects. It scales well without adding legal paperwork.
## One more subtle advantage
After hearing your vision over the past few days, I don't think your long-term value is the engine itself. I think it's becoming the **reference implementation** for a standard way to evaluate backend engineering skills.
Apache 2.0 sends a subtle but important signal:
> "This is infrastructure. We want companies to adopt it, extend it, and build around it."
MIT says:
> "Here's some code."
Both are excellent licenses. But Apache 2.0 better matches the ambitions you've described for this project: not just an open-source repository, but the foundation of an ecosystem.
