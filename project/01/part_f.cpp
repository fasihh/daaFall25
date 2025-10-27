#include <bits/stdc++.h>

using namespace std;

void solve() {
	int n;
	cin >> n;
	vector<int> v(n);
	for (auto& e : v)
		cin >> e;

	int l = 1, r = n-2;
	while (l <= r) {
		int m = l + (r - l) / 2;

		if (v[m-1] < v[m] && v[m] < v[m+1]) {
			l = m+1;
		} else if (v[m-1] > v[m] && v[m] > v[m+1]) {
			r = m-1;
		} else if (v[m-1] < v[m] && v[m] > v[m+1]) {
			cout << m;
			return;
		}
	}

	cout << -1;
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

