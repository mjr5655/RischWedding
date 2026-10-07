# Wedding site

Static site (no build step). Host on GitHub Pages in its own repo.

1. Create a new repo (e.g. `wedding`), copy the contents of this folder to its root, push.
2. Settings → Pages → deploy from the `main` branch, root.
3. The `CNAME` file already contains `rischwedding.com`. Point the domain's DNS at GitHub Pages
   (A records 185.199.108.153 / .109.153 / .110.153 / .111.153, or a CNAME to `<user>.github.io`).
4. Search `index.html` for `[` to find every placeholder. Set the countdown date in the script at the bottom.
