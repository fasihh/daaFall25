#include <bits/stdc++.h>

using namespace std;

struct result {
	int val;
	int i, j;
	int max_idx, min_idx;
};

void solve() {
	int n;
	cin >> n;
	vector<int> v(n);
	for (auto& e : v)
		cin >> e;

	function<result(int, int)> fn = [&](int l, int r) {
		if (l >= r)
			return result{0, l, l, l, l};

		int m = l + (r - l) / 2;
		result lres = fn(l, m);
		result rres = fn(m+1, r);

		int max_idx = v[lres.max_idx] > v[rres.max_idx] ? lres.max_idx : rres.max_idx;
		int min_idx = v[lres.min_idx] < v[rres.min_idx] ? lres.min_idx : rres.min_idx;
		int cross_val = v[rres.max_idx] - v[lres.min_idx];

		result res = lres;
		if (rres.val > res.val)
			res = rres;
		if (cross_val > res.val)
			res = {cross_val, rres.max_idx, lres.min_idx};
		
		res.max_idx = max_idx;
		res.min_idx = min_idx;

		return res;
	};
	
	result res = fn(0, n-1);
	cout << res.i << " " << res.j;
}

int main() {
	int t;
	cin >> t;
	while (t--) {
		solve();
		cout << '\n';
	}

	return 0;
}
