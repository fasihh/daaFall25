// exercise 1 from book
#include <bits/stdc++.h>

using namespace std;

void solve() {
  int n;
  cin >> n;
  vector<int> a(n), b(n);
  for (auto& e : a)
    cin >> e;
  for (auto& e : b)
    cin >> e;
  
  int l = 0, r = n;
  while (l <= r) {
    int m1 = l + (r - l) / 2;
    int m2 = n - m1;

    int la = m1 == 0 ? INT_MIN : a[m1 - 1];
    int ra = m1 == n ? INT_MAX : a[m1];
    int lb = m2 == 0 ? INT_MIN : b[m2 - 1];
    int rb = m2 == n ? INT_MAX : b[m2];
    
    if (la <= rb && lb <= ra) {
      cout << (max(la, lb) + min(ra, rb)) / 2.0;
      break;
    }

    if (la > rb) {
      r = m1 - 1;
    } else {
      l = m1 + 1;
    }
  }
}

int main() {
  int t;
  cin >> t;
  while(t--) {
    solve();
    cout << '\n';
  }

  return 0;
}