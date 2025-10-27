// exercise 3 from book
#include <bits/stdc++.h>

using namespace std;

void solve() {
  int n;
  cin >> n;
  vector<int> v(n);
  for (auto& e : v)
    cin >> e;
  
  function<pair<bool, int>(int, int)> fn = [&](int l, int r) {
    if (l == r)
      return make_pair(1, v[l]);

    int m = l + (r - l) / 2;
    auto [l_flag, l_major] = fn(l, m);
    auto [r_flag, r_major] = fn(m+1, r);

    if (l_flag && r_flag && l_major == r_major)
      return make_pair(1, l_major);
    
    int l_cnt = 0, r_cnt = 0;
    if (l_flag || r_flag) {
      for (int i = l; i <= r; ++i) {
        if (l_flag)
          l_cnt += v[i] == l_major; // equivalence tested
        if (r_flag)
          r_cnt += v[i] == r_major; // equivalence tested
      }
    } else {
      return make_pair(0, -1);
    }

    int n = r - l + 1;
    if (l_cnt > n / 2)
      return make_pair(1, l_major);
    if (r_cnt > n / 2)
      return make_pair(1, r_major);
    return make_pair(0, -1);
  };

  auto [flag, major] = fn(0, n-1);
  if (flag)
    cout << major;
  else
    cout << "NO";
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