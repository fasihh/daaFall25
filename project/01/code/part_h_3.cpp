// exercise 6 from book
#include <bits/stdc++.h>

using namespace std;

struct Node {
  float val;
  Node *left = nullptr, *right = nullptr;
};

void solve() {
  int n;
  cin >> n;
  vector<float> v(n);
  for (auto& e : v)
    cin >> e;
  
  // converting input array to node representation
  function<Node *(int, int)> create = [&](int l, int r) {
    if (l >= r)
      return (Node *)nullptr;
    
    int m = l + (r - l) / 2;
    Node *node = new Node{v[m]};
    node->left = create(l, m);
    node->right = create(m+1, r);

    return node;
  };

  function<float(Node *)> dfs = [&](Node *root) {
    if (!root)
      return INFINITY;
    
    float left_val = root->left ? root->left->val : INFINITY;
    float right_val = root->right ? root->right->val : INFINITY;
    if (root->val < left_val && root->val < right_val)
      return root->val;
    
    if (left_val < right_val)
      return dfs(root->left);
    return dfs(root->right);
  };

  Node *root = create(0, n-1);
  cout << dfs(root);
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