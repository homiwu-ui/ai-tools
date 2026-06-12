# Multi-Platform Search Workflow

When user says "搜尋 X" or "找 X 資料" or similar search requests, execute the following workflow:

## 1. Target Platforms

Query ALL of the following in parallel via `websearch`:

| Platform | Search Query Pattern |
|----------|---------------------|
| GitLab | `site:gitlab.com <keyword>` |
| Bitbucket | `site:bitbucket.org <keyword>` |
| SourceForge | `site:sourceforge.net <keyword>` |
| Codeberg | `site:codeberg.org <keyword>` |
| AlternativeTo | `site:alternativeto.net <keyword>` |
| LibHunt | `site:libhunt.com <keyword>` |
| Hugging Face | `site:huggingface.co <keyword>` |
| Docker Hub | `site:hub.docker.com <keyword>` |
| npm | `site:www.npmjs.com <keyword>` |
| PyPI | `site:pypi.org <keyword>` |
| Maven Central | `site:search.maven.org <keyword>` |
| Awesome Lists | `awesome <keyword> site:github.com OR site:gitlab.com` |

Also include general web search without site restriction.

## 2. Response Format

Present results as a table:

```
| 平台 | 專案名稱 | 簡介 | 星數/下載量 |
|------|---------|------|------------|
| GitLab | xxx | ... | ⭐ N |
| GitHub | xxx | ... | ⭐ N |
```

If no results found on a platform, skip it (don't list empty rows).

## 3. Notes

- Do NOT require API keys — use websearch only
- If user provides a specific platform name, narrow to that platform
- If user provides a category (e.g. "筆記軟體", "CI/CD工具"), focus on that category
