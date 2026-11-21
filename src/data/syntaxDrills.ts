import type { Question } from '../types';
import { code } from './code';

/*
 * Pure syntax & function-call drills.
 *
 * Coverage was planned from:
 *  - The 16 interview coding patterns in Chanda-Abdul/Several-Coding-Patterns-for-Solving-Data-Structures-
 *    and-Algorithms-Problems-during-Interviews (sliding window, two pointers, fast & slow pointers, merge
 *    intervals, cyclic sort, in-place list reversal, tree BFS/DFS, two heaps, subsets, modified binary
 *    search, bitwise XOR, top-K, K-way merge, 0/1 knapsack DP, topological sort) — translated into the
 *    exact C++ STL calls each pattern needs.
 *  - Interview-oriented C++ STL cheat sheets on GitHub (MAZHARMIK/Cpp-STL-Quick-Help,
 *    gibsjose/cpp-cheat-sheet, 4db/cpp-cheat-sheet): rotate, next_permutation, stringstream parsing,
 *    transform/tolower, count_if, set algorithms, iota, gcd, heap/comparator syntax.
 * All questions are original; answers were checked against the C++17/20 standard library specification.
 */

// ============================================================================
// Syntax & Methods — drills
// ============================================================================
export const SYNTAX_DRILLS: Question[] = [
  {
    id: 'sm-16',
    category: 'Syntax & Methods',
    difficulty: 'Quick Syntax',
    prompt: 'Sliding-window / anagram problems: with `int freq[26] = {};` and a lowercase `char c`, which line counts `c`?',
    options: ['`freq[c]++;`', '`freq[c - \'a\']++;`', '`freq[\'a\' - c]++;`', '`freq[int(c)]++;`'],
    correctIndex: 1,
    explanation:
      'Letters are consecutive char codes, so `c - \'a\'` maps `\'a\'..\'z\'` to `0..25`. `freq[c]` and `freq[int(c)]` index at 97+ and run past the array. `\'a\' - c` is negative for every letter after `a`.',
    deepDive: {
      conceptTitle: 'Char arithmetic',
      details:
        '`char` is an integer type, and arithmetic promotes it to `int`. Common idioms: digit value `c - \'0\'`, letter index `c - \'a\'`, back to a char `char(\'a\' + i)`. A fixed `int[26]` or `std::array<int, 26>` is faster than `unordered_map<char, int>` and can be compared with `==` (for `std::array`).',
      interviewTip: 'For an anagram check, `std::array<int, 26>` and comparing `a == b` is a clean one-liner.',
    },
  },
  {
    id: 'sm-17',
    category: 'Syntax & Methods',
    difficulty: 'Quick Syntax',
    prompt: 'Which expression turns the integer `42` into the `std::string` `"42"`?',
    options: ['`std::string(42)`', '`std::to_string(42)`', '`(std::string)42`', '`std::itoa(42)`'],
    correctIndex: 1,
    explanation:
      '`std::to_string` (in `<string>`) has overloads for every arithmetic type. `std::string` has no constructor from a single `int`, so both the constructor call and the cast fail to compile. `itoa` is non-standard and isn\'t in `std`.',
    deepDive: {
      conceptTitle: 'Number ⇄ string',
      details:
        'Number to string: `std::to_string(x)`. For `double` it prints 6 decimals (`"3.140000"`), so use `std::ostringstream` or `std::format` (C++20) for control. String to number: `std::stoi`, `std::stol`, `std::stoll`, `std::stod`. A single digit char to int is `c - \'0\'`, and an int to a char digit is `char(\'0\' + d)`.',
      interviewTip: 'To get the digits of a number, `std::to_string(n)` and a loop over the chars is quick to write and hard to get wrong.',
    },
  },
  {
    id: 'sm-18',
    category: 'Syntax & Methods',
    difficulty: 'Quick Syntax',
    prompt: 'Which line converts `std::string s` to lowercase in place?',
    options: [
      '`s.tolower();`',
      '`std::transform(s.begin(), s.end(), s.begin(), [](unsigned char c) { return std::tolower(c); });`',
      '`s = std::tolower(s);`',
      '`std::for_each(s.begin(), s.end(), std::tolower);`',
    ],
    correctIndex: 1,
    explanation:
      '`std::string` has no case methods, and `std::tolower` works on one character at a time. `transform` writes each result back through `s.begin()`. `for_each` throws away the return value, so nothing changes, and `std::tolower` is overloaded, so passing it by name is ambiguous anyway.',
    deepDive: {
      conceptTitle: '<cctype> functions',
      details:
        '`std::tolower`, `std::toupper`, `std::isdigit`, `std::isalpha`, `std::isalnum` and `std::isspace` take an `int` that must be representable as `unsigned char` or equal `EOF`. Passing a negative `char`, such as a non-ASCII byte, is undefined behavior, which is why the lambda takes `unsigned char`. In a range loop: `for (char& c : s) c = std::tolower(static_cast<unsigned char>(c));`.',
      interviewTip: 'For "valid palindrome", combine `std::isalnum` with `std::tolower` and use two pointers. No new string needed.',
    },
  },
  {
    id: 'sm-19',
    category: 'Syntax & Methods',
    difficulty: 'Quick Syntax',
    prompt: 'Which call removes the LAST character of a non-empty `std::string s`?',
    options: ['`s.erase(s.end());`', '`s.pop_back();`', '`s.remove_last();`', '`s.substr(0, s.size());`'],
    correctIndex: 1,
    explanation:
      '`pop_back()` (C++11) removes the last character, just like `vector::pop_back`. `s.erase(s.end())` erases the element at `end()`, which doesn\'t exist, so it\'s undefined behavior. `remove_last` doesn\'t exist. `substr(0, size())` returns a full copy and doesn\'t modify `s`.',
    deepDive: {
      conceptTitle: 'std::string as a sequence container',
      details:
        '`std::string` supports `push_back(c)`, `pop_back()`, `back()`, `front()`, `insert`, `erase(pos, len)`, `append`, `+=` and `resize`. That makes it a good stack of chars for backtracking (`path.push_back(c); recurse(); path.pop_back();`) or for "remove adjacent duplicates" problems. `back()` and `pop_back()` on an empty string are undefined behavior.',
      interviewTip: 'Use the string itself as a stack in "valid parentheses" or "remove k digits" problems. It avoids a `std::stack<char>` and builds the answer directly.',
    },
  },
  {
    id: 'sm-20',
    category: 'Syntax & Methods',
    difficulty: 'Quick Syntax',
    prompt: 'Which snippet correctly splits `line` into whitespace-separated words?',
    options: [
      '`for (auto w : line.split(\' \')) words.push_back(w);`',
      '`std::istringstream iss(line); std::string w; while (iss >> w) words.push_back(w);`',
      '`std::istringstream iss(line); std::string w; while (!iss.eof()) { iss >> w; words.push_back(w); }`',
      '`words = std::split(line, \' \');`',
    ],
    correctIndex: 1,
    explanation:
      '`iss >> w` skips whitespace, reads one word, and makes the stream false once extraction fails, so it is the loop condition itself. Checking `eof()` before reading is a classic bug: with trailing whitespace the final read fails and the last word is pushed twice. Neither `std::split` nor `string::split` exists.',
    deepDive: {
      conceptTitle: 'stringstream tokenizing (<sstream>)',
      details:
        '`std::istringstream` wraps a string as an input stream, so everything that works with `std::cin` works here, including mixed types: `iss >> name >> age;`. Always test the result of the read, not `eof()`. C++20 also offers `std::views::split(line, \' \')`, but it\'s awkward for interviews.',
      interviewTip: 'For "reverse words in a string", stream the words into a vector, reverse it, and join. Clear and correct on the first try.',
    },
  },
  {
    id: 'sm-21',
    category: 'Syntax & Methods',
    difficulty: 'Quick Syntax',
    prompt: 'With `std::stringstream ss("a,b,c"); std::string tok;`, which loop reads `a`, `b`, `c`?',
    options: [
      '`while (ss >> tok)`',
      '`while (std::getline(ss, tok, \',\'))`',
      '`while (std::getline(ss, tok, ","))`',
      '`while (ss.split(\',\', tok))`',
    ],
    correctIndex: 1,
    explanation:
      'The three-argument `std::getline(stream, str, delim)` reads up to a custom delimiter, which must be a single `char`. A `","` string literal doesn\'t compile. `ss >> tok` splits on whitespace only, so it reads `"a,b,c"` as one token.',
    deepDive: {
      conceptTitle: 'getline with a delimiter',
      details:
        'The signature is `std::istream& getline(std::istream& is, std::string& str, char delim = \'\\n\')`. It discards the delimiter and returns the stream, so it works as a loop condition. Use it for CSV fields, IP address octets (`\'.\'`) and path components (`\'/\'`). Empty fields like `"a,,b"` come back as empty strings, so filter them if needed (e.g. "simplify path").',
      interviewTip: 'For "simplify Unix path", split on `\'/\'` with `getline` and skip `""` and `"."`.',
    },
  },
  {
    id: 'sm-22',
    category: 'Syntax & Methods',
    difficulty: 'Quick Syntax',
    prompt: 'What order does `std::sort` give `std::vector<std::pair<int,int>> v{{2,1},{1,5},{1,2}}` with no comparator?',
    options: [
      '`{1,5}, {1,2}, {2,1}`',
      '`{1,2}, {1,5}, {2,1}`',
      '`{2,1}, {1,2}, {1,5}`',
      'Compile error: pairs need a comparator',
    ],
    correctIndex: 1,
    explanation:
      '`std::pair` has a built-in `operator<` that compares `first`, then `second` on ties. So `{1,2}` comes before `{1,5}`, and both come before `{2,1}`. `std::tuple`, `std::array` and `std::vector` compare lexicographically as well.',
    deepDive: {
      conceptTitle: 'Lexicographic comparison for free',
      details:
        '`pair`, `tuple`, `array`, `vector` and `string` all compare lexicographically. Sorting intervals given as `vector<vector<int>>` therefore sorts by start, then end, with no lambda needed. For a custom order, a lambda like `[](const auto& a, const auto& b) { return a.second < b.second; }` sorts by the second member. C++20 adds `<=>` and defaulted comparisons for your own structs.',
      interviewTip: 'Encode a sort key as a pair (e.g. `{-freq, word}`) to sort by frequency descending and then alphabetically, without writing a comparator.',
    },
  },
  {
    id: 'sm-23',
    category: 'Syntax & Methods',
    difficulty: 'Quick Syntax',
    prompt: 'Which expression gives the largest `int` value (e.g. to initialize a running minimum)?',
    options: [
      '`std::numeric_limits<int>.max()`',
      '`std::numeric_limits<int>::max()`',
      '`std::numeric_limits::max<int>()`',
      '`std::int_max`',
    ],
    correctIndex: 1,
    explanation:
      '`numeric_limits` is a class template, and `max()` is a static member function, so you write `std::numeric_limits<int>::max()` (in `<limits>`). The `.max()` and `max<int>()` forms don\'t compile, and `std::int_max` doesn\'t exist. `INT_MAX` from `<climits>` also works.',
    deepDive: {
      conceptTitle: '<limits>',
      details:
        'Useful members: `max()`, `min()` (for floating point this is the smallest positive value; use `lowest()` for the most negative), `infinity()`, `digits`. Starting a min-search at `INT_MAX` and then adding to it overflows. Many solutions use `1e9` or `LLONG_MAX / 2` as a safe "infinity" for distances.',
      interviewTip: 'Initialize `best = std::numeric_limits<int>::max()` for min-searches, but never add to it unchecked.',
    },
  },
  {
    id: 'sm-24',
    category: 'Syntax & Methods',
    difficulty: 'Quick Syntax',
    prompt: '0/1 knapsack DP: which line creates an `(n+1) × (W+1)` table of zeros?',
    options: [
      '`std::vector<std::vector<int>> dp(n + 1, W + 1);`',
      '`std::vector<std::vector<int>> dp(n + 1, std::vector<int>(W + 1, 0));`',
      '`std::vector<int> dp(n + 1)(W + 1);`',
      '`std::vector<std::vector<int>> dp[n + 1][W + 1];`',
    ],
    correctIndex: 1,
    explanation:
      'The outer constructor is `(count, value)`, and the value must be a whole row: `std::vector<int>(W + 1, 0)`. Passing `W + 1` as the row doesn\'t compile, because the size constructor is `explicit`. `dp(n+1)(W+1)` is a syntax error. `dp[n+1][W+1]` declares a (variable-length) array of vectors, which is neither standard nor what you want.',
    deepDive: {
      conceptTitle: 'Multi-dimensional vectors',
      details:
        'For 3D: `std::vector dp(a, std::vector(b, std::vector<int>(c, -1)));` (CTAD, C++17). For memoization use `-1` as "not computed", and use `long long` when the values can overflow. When each row depends only on the previous one (0/1 knapsack), a single `std::vector<int> dp(W + 1)` iterated with `w` from `W` down to `wt[i]` cuts space to O(W).',
      interviewTip: 'Say the space optimization out loud: "Row i only reads row i−1, so one array iterated backwards is enough."',
    },
  },
  {
    id: 'sm-25',
    category: 'Syntax & Methods',
    difficulty: 'Quick Syntax',
    prompt: 'Cyclic sort: which line exchanges `nums[i]` and `nums[j]`?',
    options: [
      '`nums.swap(i, j);`',
      '`std::swap(nums[i], nums[j]);`',
      '`std::swap(&nums[i], &nums[j]);`',
      '`std::exchange(nums[i], nums[j]);`',
    ],
    correctIndex: 1,
    explanation:
      '`std::swap(a, b)` takes two lvalue references. `vector::swap` swaps the contents of two entire vectors. `&nums[i]` gives temporary pointers that can\'t bind to `T&`. `std::exchange(a, b)` assigns `b` to `a` and returns the old `a`, leaving `b` unchanged, so it isn\'t a swap.',
    deepDive: {
      conceptTitle: 'swap, iter_swap, exchange',
      details:
        '`std::swap` (`<utility>`) moves through a temporary and has O(1) specializations for containers. `std::iter_swap(it1, it2)` swaps the elements two iterators point to. `std::exchange(obj, newVal)` (C++14) is handy in move constructors: `ptr = std::exchange(other.ptr, nullptr);`. Cyclic sort: `while (nums[i] != nums[nums[i] - 1]) std::swap(nums[i], nums[nums[i] - 1]);`.',
      interviewTip: 'In cyclic sort, compare values (`nums[i] != nums[nums[i]-1]`), not indices, to avoid an infinite loop on duplicates.',
    },
  },
  {
    id: 'sm-26',
    category: 'Syntax & Methods',
    difficulty: 'Gotcha',
    prompt: 'Subsets via bitmasks: which loop visits every subset of `n` elements (n < 31)?',
    options: [
      '`for (int mask = 0; mask < 2 ^ n; ++mask)`',
      '`for (int mask = 0; mask < (1 << n); ++mask)`',
      '`for (int mask = 0; mask <= (1 << n); ++mask)`',
      '`for (int mask = 1; mask < n * n; ++mask)`',
    ],
    correctIndex: 1,
    explanation:
      'There are 2ⁿ subsets, and `1 << n` computes 2ⁿ. `^` is bitwise XOR in C++, not exponentiation, so `2 ^ n` is wrong. `<=` visits one mask too many, and n² is the wrong count. Test whether element `i` is in a subset with `(mask >> i) & 1`.',
    deepDive: {
      conceptTitle: 'Bitmask idioms',
      details:
        'Set bit i: `m | (1 << i)`. Clear it: `m & ~(1 << i)`. Toggle it: `m ^ (1 << i)`. Test it: `(m >> i) & 1`. Lowest set bit: `m & -m`. Remove the lowest set bit: `m & (m - 1)`. For n ≥ 31 use `1LL << n` (or `1ULL`), because shifting a 32-bit `int` that far is undefined behavior.',
      interviewTip: 'Write `1 << n`, never `2 ^ n`. That typo also compiles in Java and C#, and it\'s just as wrong there.',
    },
  },
  {
    id: 'sm-27',
    category: 'Syntax & Methods',
    difficulty: 'Quick Syntax',
    prompt: 'Bitwise XOR pattern: every number in `nums` appears twice except one. Which loop body leaves the unique number in `x` (starting from `int x = 0;`)?',
    options: ['`x |= v;`', '`x ^= v;`', '`x &= v;`', '`x += v % 2;`'],
    correctIndex: 1,
    explanation:
      'XOR is associative and commutative, `a ^ a == 0` and `a ^ 0 == a`, so every pair cancels and only the single number is left. `|=` accumulates all set bits, and `&=` starting from 0 always stays 0.',
    deepDive: {
      conceptTitle: 'XOR tricks',
      details:
        'Missing number in 0..n: XOR all indices and all values together. Two unique numbers: XOR everything to get `a ^ b`, take its lowest set bit `d = x & -x`, then split the numbers into two groups by `v & d`. You can swap without a temporary using XOR, but `std::swap` is clearer. `std::accumulate(v.begin(), v.end(), 0, std::bit_xor<>())` does the fold in one line.',
      interviewTip: 'When an interviewer says "O(1) extra space" and "appears twice", think XOR.',
    },
  },
  {
    id: 'sm-28',
    category: 'Syntax & Methods',
    difficulty: 'Quick Syntax',
    prompt: 'In standard C++20, which call counts the set bits of `unsigned x`?',
    options: ['`std::bitcount(x)`', '`std::popcount(x)`', '`x.count()`', '`std::count(x, 1)`'],
    correctIndex: 1,
    explanation:
      '`std::popcount` is in `<bit>` (C++20) and only accepts unsigned integer types. `x.count()` works only on a `std::bitset`, and `std::bitcount` doesn\'t exist. `__builtin_popcount` is a GCC/Clang extension, not standard C++.',
    deepDive: {
      conceptTitle: '<bit> utilities (C++20)',
      details:
        'The C++20 `<bit>` header provides `std::popcount`, `std::countl_zero`, `std::countr_zero` (index of the lowest set bit), `std::has_single_bit` (power of two), `std::bit_width` (⌊log₂x⌋+1), `std::bit_ceil` and `std::bit_floor`. Before C++20 you can use `std::bitset<32>(x).count()`, or the Kernighan loop `while (x) { x &= x - 1; ++c; }`.',
      interviewTip: 'For a signed `int`, write `std::popcount(static_cast<unsigned>(n))`, because passing a signed type doesn\'t compile.',
    },
  },
  {
    id: 'sm-29',
    category: 'Syntax & Methods',
    difficulty: 'Concept',
    prompt: 'You want a recursive DFS lambda inside a function. Which version compiles in C++17?',
    options: [
      '`auto dfs = [&](int u) { for (int v : adj[u]) dfs(v); };`',
      '`std::function<void(int)> dfs = [&](int u) { for (int v : adj[u]) dfs(v); };`',
      '`auto dfs = [](int u) { for (int v : adj[u]) dfs(v); };`',
      '`void dfs = [&](int u) { for (int v : adj[u]) dfs(v); };`',
    ],
    correctIndex: 1,
    explanation:
      'With `auto`, the lambda\'s type isn\'t known yet inside its own initializer, so the call to `dfs` fails to compile. Declaring the type as `std::function<void(int)>` first means the reference-captured `dfs` already has a type. A lambda with no captures can\'t reach `adj` or `dfs` at all.',
    deepDive: {
      conceptTitle: 'Recursive lambdas',
      details:
        'Option 1 is `std::function` (`<functional>`). It\'s simple, but it costs an indirect call. Option 2 passes the lambda to itself: `auto dfs = [&](auto&& self, int u) -> void { ... self(self, v); }; dfs(dfs, 0);`. Option 3, C++23\'s deducing `this`, allows `[&](this auto&& self, int u) { ... self(v); }`. A named helper function also works.',
      interviewTip: 'In an interview, use `std::function` for readability, and mention the `self` trick if they ask about performance.',
    },
  },
  {
    id: 'sm-30',
    category: 'Syntax & Methods',
    difficulty: 'Quick Syntax',
    prompt: 'Which call fills `std::vector<int> idx(n)` with `0, 1, 2, …, n-1` (e.g. to sort indices)?',
    options: [
      '`std::fill(idx.begin(), idx.end(), 0);`',
      '`std::iota(idx.begin(), idx.end(), 0);`',
      '`std::generate(idx.begin(), idx.end(), 0);`',
      '`idx.iota(0);`',
    ],
    correctIndex: 1,
    explanation:
      '`std::iota` (in `<numeric>`) assigns increasing values starting at the given value. `std::fill` writes the same value everywhere. `std::generate` needs a callable, not a value. `vector` has no `iota` member.',
    deepDive: {
      conceptTitle: 'Index sort / argsort',
      details:
        'A common pattern: `std::vector<int> idx(n); std::iota(idx.begin(), idx.end(), 0); std::sort(idx.begin(), idx.end(), [&](int a, int b) { return v[a] < v[b]; });`. It sorts positions without moving the data, which is useful when you need the original indices (e.g. "two sum" with sorting, or "the k closest points with indices"). `iota` also initializes a union-find `parent` array.',
      interviewTip: 'For union-find, `std::iota(parent.begin(), parent.end(), 0);` is the expected one-liner.',
    },
  },
];

// ============================================================================
// STL Containers — drills
// ============================================================================
export const CONTAINER_DRILLS: Question[] = [
  {
    id: 'st-16',
    category: 'STL Containers',
    difficulty: 'Quick Syntax',
    prompt: 'BFS: which line correctly takes the next node out of `std::queue<int> q`?',
    options: [
      '`int u = q.top(); q.pop();`',
      '`int u = q.front(); q.pop();`',
      '`int u = q.pop();`',
      '`int u = q.front(); q.pop_front();`',
    ],
    correctIndex: 1,
    explanation:
      '`std::queue` uses `front()` to read and `pop()` (which returns `void`) to remove. `top()` belongs to `stack` and `priority_queue`. `pop_front()` is a `deque`/`list` method that the `queue` adaptor doesn\'t expose.',
    deepDive: {
      conceptTitle: 'Adaptor interfaces',
      details:
        '`std::queue`: `push`/`emplace`, `front`, `back`, `pop`, `empty`, `size`. `std::stack`: `push`, `top`, `pop`. `std::priority_queue`: `push`, `top`, `pop`. For BFS on a grid, `std::queue<std::pair<int,int>>` with `auto [r, c] = q.front(); q.pop();` reads cleanly. Mark a cell visited when you push it, not when you pop it, so it isn\'t enqueued twice.',
      interviewTip: 'Mark visited on push. That small detail separates a correct BFS from one that exceeds the time limit.',
    },
  },
  {
    id: 'st-17',
    category: 'STL Containers',
    difficulty: 'Gotcha',
    prompt: 'Level-order traversal: why is this inner loop wrong?',
    code: code`
      while (!q.empty()) {
          for (int i = 0; i < q.size(); ++i) {   // process one level
              TreeNode* node = q.front(); q.pop();
              if (node->left)  q.push(node->left);
              if (node->right) q.push(node->right);
          }
          ++level;
      }
    `,
    options: [
      '`q.size()` is re-evaluated every iteration while the loop pushes and pops, so levels get mixed',
      '`q.front()` returns a copy, so the nodes are never removed',
      'It\'s correct as written',
      '`TreeNode*` can\'t be stored in a `std::queue`',
    ],
    correctIndex: 0,
    explanation:
      'Each pass pops one node and may push its children, so `q.size()` keeps changing while `i` grows. The loop stops at the wrong point and mixes nodes from different levels. Capture the size once: `for (int sz = q.size(); sz > 0; --sz)`, or `int n = q.size();` before the loop.',
    deepDive: {
      conceptTitle: 'BFS by levels',
      details:
        'Template: `while (!q.empty()) { int sz = q.size(); for (int i = 0; i < sz; ++i) { auto x = q.front(); q.pop(); /* push neighbors */ } ++depth; }`. The same template answers "minimum steps" questions (rotting oranges, word ladder): the level counter is the distance. Comparing `int` with `size()` (unsigned) also triggers sign-compare warnings, which is one more reason to store the size in an `int`.',
      interviewTip: 'Freeze `sz` before the inner loop. Interviewers look for exactly this line.',
    },
  },
  {
    id: 'st-18',
    category: 'STL Containers',
    difficulty: 'Concept',
    prompt: 'Sliding window over distinct characters with `std::unordered_map<char, int> cnt;`: why do we write `if (--cnt[c] == 0) cnt.erase(c);` when shrinking the window?',
    options: [
      'Because `operator[]` can\'t decrement values',
      'So that `cnt.size()` equals the number of DISTINCT chars currently in the window',
      'To avoid a memory leak',
      'Because `unordered_map` values can\'t be zero',
    ],
    correctIndex: 1,
    explanation:
      'Keys whose count drops to 0 still exist in the map, and `size()` counts keys. Erasing them keeps `cnt.size()` equal to the number of distinct characters in the window, which is the condition "longest substring with at most K distinct" checks.',
    deepDive: {
      conceptTitle: 'Sliding window template',
      details:
        '`for (int r = 0; r < n; ++r) { ++cnt[s[r]]; while (/* window invalid */) { if (--cnt[s[l]] == 0) cnt.erase(s[l]); ++l; } best = std::max(best, r - l + 1); }`. Each index enters and leaves the window once, so it\'s O(n). With only 26 or 128 possible chars, an array plus a separate `distinct` counter is faster than a hash map.',
      interviewTip: 'Say the invariant: "the window [l, r] is always valid after the while loop".',
    },
  },
  {
    id: 'st-19',
    category: 'STL Containers',
    difficulty: 'Quick Syntax',
    prompt: 'How do you read the LARGEST key of a non-empty `std::map<int, std::string> m`?',
    options: ['`m.end()->first`', '`m.rbegin()->first`', '`m.back().first`', '`m.max_key()`'],
    correctIndex: 1,
    explanation:
      '`std::map` is sorted by key, so the reverse iterator `rbegin()` points to the largest key and `begin()` to the smallest. `end()` is one past the last element, and dereferencing it is undefined behavior. `map` has no `back()` and no `max_key()`. `std::prev(m.end())->first` also works.',
    deepDive: {
      conceptTitle: 'Ordered container extremes',
      details:
        'In a `std::set`/`std::map`, the minimum is `*s.begin()` and the maximum is `*s.rbegin()` (or `*std::prev(s.end())`). Both are O(1) once you have the iterator. To pop the max: `s.erase(std::prev(s.end()));`. A multiset gives you a heap that also supports removing an arbitrary element, which `priority_queue` can\'t do.',
      interviewTip: 'Need both a min and a max with deletions, e.g. a sliding-window max/min? A `std::multiset` handles it in O(log n) per operation.',
    },
  },
  {
    id: 'st-20',
    category: 'STL Containers',
    difficulty: 'Quick Syntax',
    prompt: 'Which statement removes the SMALLEST element of a non-empty `std::set<int> s`?',
    options: ['`s.pop_front();`', '`s.erase(s.begin());`', '`s.erase(s.front());`', '`s.erase(s.end() - 1);`'],
    correctIndex: 1,
    explanation:
      '`begin()` points to the smallest element, and `erase(iterator)` removes it in amortized O(1). `std::set` has no `pop_front` and no `front`. Set iterators are bidirectional, so `end() - 1` doesn\'t compile, and it would point to the largest element anyway.',
    deepDive: {
      conceptTitle: 'set as a priority queue',
      details:
        'A `std::set<std::pair<int,int>>` works as an indexed priority queue in Dijkstra: `auto [d, u] = *s.begin(); s.erase(s.begin());`. To decrease a key, erase `{oldDist, v}` and insert `{newDist, v}`, which `priority_queue` can\'t do. Each operation is O(log n).',
      interviewTip: 'Use set-based Dijkstra when you want true decrease-key, and `priority_queue` with lazy deletion when you want simpler code.',
    },
  },
  {
    id: 'st-21',
    category: 'STL Containers',
    difficulty: 'Quick Syntax',
    prompt: 'Two heaps (find median): `lo` is a max-heap of the smaller half and `hi` is a min-heap of the larger half, with equal sizes. Which expression gives the median?',
    options: [
      '`(lo.top() + hi.top()) / 2`',
      '`(lo.top() + hi.top()) / 2.0`',
      '`(lo.front() + hi.front()) / 2.0`',
      '`lo.top() / hi.top()`',
    ],
    correctIndex: 1,
    explanation:
      'The median is the average of the two middle values, which sit on the heap tops. Dividing by the `int` 2 truncates, so `/ 2.0` is needed to get a `double`. `priority_queue` has no `front()`.',
    deepDive: {
      conceptTitle: 'Two-heaps pattern',
      details:
        'Declarations: `std::priority_queue<int> lo;` and `std::priority_queue<int, std::vector<int>, std::greater<int>> hi;`. Insert with `lo.push(x); hi.push(lo.top()); lo.pop(); if (hi.size() > lo.size()) { lo.push(hi.top()); hi.pop(); }`. That keeps `lo.size()` equal to `hi.size()` or one more. Each insert is O(log n) and reading the median is O(1).',
      interviewTip: 'With large ints, `lo.top() + hi.top()` can overflow. Write `lo.top() + (hi.top() - lo.top()) / 2.0`, or cast to `long long` first.',
    },
  },
  {
    id: 'st-22',
    category: 'STL Containers',
    difficulty: 'Quick Syntax',
    prompt: 'K-way merge with `std::priority_queue<std::tuple<int,int,int>, std::vector<std::tuple<int,int,int>>, std::greater<>> pq;` — which line inserts `(value, listIdx, elemIdx)`?',
    options: [
      '`pq.push(value, listIdx, elemIdx);`',
      '`pq.emplace(value, listIdx, elemIdx);`',
      '`pq.emplace_back(value, listIdx, elemIdx);`',
      '`pq.insert({value, listIdx, elemIdx});`',
    ],
    correctIndex: 1,
    explanation:
      '`emplace` forwards its arguments to the tuple\'s constructor. `push` takes exactly one element, so you\'d write `pq.push({value, listIdx, elemIdx})`. Adaptors don\'t have `emplace_back` or `insert`. Read the top back with `auto [v, i, j] = pq.top();`.',
    deepDive: {
      conceptTitle: 'K-way merge',
      details:
        'Seed the heap with the first element of each list. Then repeatedly pop the smallest, append it to the output, and push the next element from the same list. With N total elements and K lists, the time is O(N log K) and the heap is O(K). Tuples compare lexicographically, so `std::greater<>` orders by `value` first. The same pattern solves "smallest range covering K lists" and "kth smallest in a sorted matrix".',
      interviewTip: 'For "merge K sorted linked lists", push `ListNode*` with a lambda comparator `[](ListNode* a, ListNode* b) { return a->val > b->val; }`.',
    },
  },
  {
    id: 'st-23',
    category: 'STL Containers',
    difficulty: 'Concept',
    prompt: 'For `std::unordered_map<char, int> freq;`, what does `freq[\'x\']++` do when `\'x\'` isn\'t in the map yet?',
    options: [
      'Undefined behavior: the value is uninitialized',
      'Inserts `\'x\'` with a value-initialized `0`, then increments it to `1`',
      'Throws `std::out_of_range`',
      'Does nothing',
    ],
    correctIndex: 1,
    explanation:
      '`operator[]` inserts `value_type(key, T())` when the key is missing. For `int`, `T()` is value-initialized to `0`. That\'s why `++freq[c]` is the standard counting idiom. `at()` is the version that throws.',
    deepDive: {
      conceptTitle: 'Counting idioms',
      details:
        'To count: `for (char c : s) ++freq[c];`. To find the most common element: `std::max_element(freq.begin(), freq.end(), [](const auto& a, const auto& b) { return a.second < b.second; })`. To group, e.g. anagrams: `groups[sortedKey].push_back(word);`, where a missing key becomes an empty vector. The value type needs a default constructor for `operator[]` to work.',
      interviewTip: 'For "top K frequent", count into an `unordered_map`, then keep a min-heap of size K of `{count, value}` pairs.',
    },
  },
  {
    id: 'st-24',
    category: 'STL Containers',
    difficulty: 'Concept',
    prompt: 'Topological sort with Kahn\'s algorithm: after building `std::vector<std::vector<int>> adj(n)` and `std::vector<int> indeg(n)`, what goes into the queue first?',
    options: [
      'Node 0 only',
      'Every node with `indeg[v] == 0`',
      'Every node with the highest in-degree',
      'All nodes, in index order',
    ],
    correctIndex: 1,
    explanation:
      'Nodes with no incoming edges have no prerequisites, so they can come first. Each time you pop a node `u`, you decrement `indeg[v]` for every `v` in `adj[u]` and push `v` when its in-degree reaches 0. If fewer than n nodes come out, the graph has a cycle.',
    deepDive: {
      conceptTitle: 'Kahn\'s algorithm',
      details:
        'Build the graph with `for (auto& e : edges) { adj[e[0]].push_back(e[1]); ++indeg[e[1]]; }`. It runs in O(V + E). Using a `priority_queue`/min-heap instead of a queue gives the lexicographically smallest order. The DFS alternative records each node after visiting its children and reverses that order at the end, detecting cycles with three colors (white, gray, black).',
      interviewTip: 'For "course schedule", answer whether `order.size() == n`. That single check is the cycle detection.',
    },
  },
  {
    id: 'st-25',
    category: 'STL Containers',
    difficulty: 'Concept',
    prompt: 'Monotonic deque for "sliding window maximum" (window size `k`, deque `dq` stores INDICES in decreasing value order). Which line drops an index that has left the window at step `i`?',
    options: [
      '`if (dq.back() <= i - k) dq.pop_back();`',
      '`if (!dq.empty() && dq.front() <= i - k) dq.pop_front();`',
      '`if (dq.front() < i) dq.pop_front();`',
      '`dq.erase(i - k);`',
    ],
    correctIndex: 1,
    explanation:
      'The oldest index is at the front. Once it is `<= i - k`, it\'s outside the window `[i-k+1, i]`, so pop it from the front, checking `empty()` first. The back is where smaller values get popped before pushing `i`. `deque::erase` takes an iterator, not an index.',
    deepDive: {
      conceptTitle: 'Monotonic deque',
      details:
        'Each step: (1) pop the front if it\'s out of the window, (2) `while (!dq.empty() && nums[dq.back()] <= nums[i]) dq.pop_back();`, (3) `dq.push_back(i);`, (4) once `i >= k - 1`, the max is `nums[dq.front()]`. Every index is pushed and popped at most once, so the whole pass is O(n). Store indices, not values, so you can tell when an element has left the window.',
      interviewTip: 'Explain why it\'s amortized O(n): every index enters and leaves the deque exactly once.',
    },
  },
];

// ============================================================================
// Algorithms & Iterators — drills
// ============================================================================
export const ALGORITHM_DRILLS: Question[] = [
  {
    id: 'al-16',
    category: 'Algorithms & Iterators',
    difficulty: 'Gotcha',
    prompt: 'Merge intervals (already sorted by start). `res.back()` is the last merged interval and `cur` the next one. When they overlap (`cur[0] <= res.back()[1]`), which update is correct?',
    options: [
      '`res.back()[1] = cur[1];`',
      '`res.back()[1] = std::max(res.back()[1], cur[1]);`',
      '`res.push_back(cur);`',
      '`res.back()[0] = std::min(res.back()[0], cur[0]);`',
    ],
    correctIndex: 1,
    explanation:
      'If `cur` lies completely inside the last interval (e.g. `[1,10]` then `[2,3]`), assigning `cur[1]` would shrink the end to 3. Taking `max` keeps 10. The start never needs updating, because the input is sorted by start.',
    deepDive: {
      conceptTitle: 'Merge intervals template',
      details:
        '`std::sort(iv.begin(), iv.end());` sorts `vector<vector<int>>` or `vector<pair<int,int>>` lexicographically, i.e. by start, with no comparator needed. Then: `for (auto& cur : iv) { if (res.empty() || cur[0] > res.back()[1]) res.push_back(cur); else res.back()[1] = std::max(res.back()[1], cur[1]); }`. It\'s O(n log n) for the sort and O(n) for the merge.',
      interviewTip: 'Clarify whether touching intervals like `[1,2]` and `[2,3]` count as overlapping. That decides between `>` and `>=`.',
    },
  },
  {
    id: 'al-17',
    category: 'Algorithms & Iterators',
    difficulty: 'Quick Syntax',
    prompt: 'Which call rotates `std::vector<int> v` to the RIGHT by `k` (0 < k < n), e.g. `{1,2,3,4,5}`, k=2 → `{4,5,1,2,3}`?',
    options: [
      '`std::rotate(v.begin(), v.begin() + k, v.end());`',
      '`std::rotate(v.begin(), v.end() - k, v.end());`',
      '`std::rotate(v.end() - k, v.begin(), v.end());`',
      '`std::reverse(v.begin(), v.begin() + k);`',
    ],
    correctIndex: 1,
    explanation:
      '`std::rotate(first, middle, last)` makes `*middle` the new first element. To rotate right by k, the last k elements must come to the front, so `middle = v.end() - k`. `begin() + k` rotates left. `rotate(v.end() - k, v.begin(), v.end())` isn\'t a valid `[first, middle, last]` ordering, and reversing a prefix alone doesn\'t rotate anything.',
    deepDive: {
      conceptTitle: 'std::rotate',
      details:
        '`rotate` is O(n) and returns an iterator to where the original first element ended up (C++11). Normalize first with `k %= n`. The classic triple-reverse rotation, reversing the whole range and then each part, is what you\'d hand-write if asked. To rotate a string: `std::rotate(s.begin(), s.begin() + k, s.end());`.',
      interviewTip: 'Do `k %= n` before rotating. `k > n` is a standard edge case.',
    },
  },
  {
    id: 'al-18',
    category: 'Algorithms & Iterators',
    difficulty: 'Quick Syntax',
    prompt: 'To visit ALL permutations of `v` with `std::next_permutation`, what must you do first?',
    options: [
      'Nothing: it always starts from the first permutation',
      'Sort `v` ascending, then use `do { … } while (std::next_permutation(v.begin(), v.end()));`',
      'Sort `v` descending',
      'Remove duplicates',
    ],
    correctIndex: 1,
    explanation:
      '`next_permutation` moves to the next permutation in lexicographic order. It returns `false` (and resets to the sorted order) once it passes the last one. Starting from ascending order means you visit every permutation. A `do-while` processes the initial order too. Duplicates are fine, since each distinct permutation is produced once.',
    deepDive: {
      conceptTitle: 'Permutation algorithms',
      details:
        '`next_permutation` and `prev_permutation` are each amortized O(1) per step (O(n) worst case) and work in place on bidirectional iterators. With repeated elements they produce only distinct permutations, so "Permutations II" needs no `set`. `std::is_permutation(a.begin(), a.end(), b.begin())` checks for anagrams in O(n²) worst case, so a frequency count is better.',
      interviewTip: '"Next permutation" is also a classic question on its own. Know the steps: find the pivot, swap it with the rightmost larger element, reverse the suffix.',
    },
  },
  {
    id: 'al-19',
    category: 'Algorithms & Iterators',
    difficulty: 'Quick Syntax',
    prompt: 'Which line reverses `std::string s` in place?',
    options: [
      '`s.reverse();`',
      '`std::reverse(s.begin(), s.end());`',
      '`std::reverse(s.begin(), s.size());`',
      '`s = std::string(s.end(), s.begin());`',
    ],
    correctIndex: 1,
    explanation:
      '`std::reverse` takes an iterator range. `std::string` has no `reverse()` member (only `std::list` and `std::forward_list` do). Mixing an iterator with `size()` doesn\'t compile. Constructing from `(end, begin)` is an invalid range, which is undefined behavior. A reversed copy is `std::string(s.rbegin(), s.rend())`.',
    deepDive: {
      conceptTitle: 'Reverse idioms',
      details:
        'To reverse in place: `std::reverse(first, last)`, which is O(n). To get a reversed copy: `std::string r(s.rbegin(), s.rend());`. To reverse part of a range: `std::reverse(v.begin() + i, v.begin() + j + 1);`. C++20 also has `std::ranges::reverse(s);`. Reversing a subrange is the building block for "reverse words", "rotate array" and "next permutation".',
      interviewTip: 'Palindrome check in one line: `s == std::string(s.rbegin(), s.rend())`. Two pointers save the extra memory.',
    },
  },
  {
    id: 'al-20',
    category: 'Algorithms & Iterators',
    difficulty: 'Quick Syntax',
    prompt: 'Which line counts the even numbers in `std::vector<int> v`?',
    options: [
      '`int c = std::count(v.begin(), v.end(), [](int x) { return x % 2 == 0; });`',
      '`int c = std::count_if(v.begin(), v.end(), [](int x) { return x % 2 == 0; });`',
      '`int c = v.count_if([](int x) { return x % 2 == 0; });`',
      '`int c = std::count_if(v.begin(), v.end(), x % 2 == 0);`',
    ],
    correctIndex: 1,
    explanation:
      '`count_if` takes a predicate. `std::count` compares each element to a VALUE with `==`, and comparing an `int` to a lambda doesn\'t compile. Containers don\'t have algorithm members like `count_if`. `x % 2 == 0` isn\'t a callable.',
    deepDive: {
      conceptTitle: 'The _if family',
      details:
        '`count`/`count_if`, `find`/`find_if`/`find_if_not`, `remove`/`remove_if`, `copy`/`copy_if`, and `replace`/`replace_if` come in pairs: the plain version compares a value, the `_if` version calls a predicate. `count_if` returns `difference_type` (signed). C++20 ranges allow `std::ranges::count_if(v, pred)` without the iterator pair.',
      interviewTip: 'Naming the right algorithm (`count_if`, `any_of`, `partition`) instead of writing a raw loop signals STL fluency.',
    },
  },
  {
    id: 'al-21',
    category: 'Algorithms & Iterators',
    difficulty: 'Gotcha',
    prompt: 'What does `std::all_of(v.begin(), v.end(), [](int x) { return x > 0; })` return when `v` is EMPTY?',
    options: ['`false`', '`true`', 'Undefined behavior', 'It throws'],
    correctIndex: 1,
    explanation:
      'This is vacuous truth: no element fails the predicate, so `all_of` is `true`. On an empty range, `any_of` is `false` and `none_of` is `true`. Code like "all positive, so take `v[0]`" therefore needs a separate emptiness check.',
    deepDive: {
      conceptTitle: 'all_of / any_of / none_of',
      details:
        'All three are in `<algorithm>`, short-circuit, and run in O(n) at most. `all_of(p)` is `!any_of(!p)`, and `none_of(p)` is `!any_of(p)`. They\'re clearer than a manual flag loop, e.g. `std::all_of(s.begin(), s.end(), ::isdigit)`, or with an `unsigned char` lambda to be safe.',
      interviewTip: 'Edge cases with empty input are where interviewers probe. Say what your function returns for `{}`.',
    },
  },
  {
    id: 'al-22',
    category: 'Algorithms & Iterators',
    difficulty: 'Concept',
    prompt: 'What does `std::set_intersection` require of its two input ranges?',
    options: [
      'Nothing: it works on any two ranges',
      'Both must be sorted with the same ordering; otherwise the result is wrong (the precondition is violated)',
      'They must be `std::set` objects',
      'They must have equal length',
    ],
    correctIndex: 1,
    explanation:
      '`set_intersection`, `set_union`, `set_difference`, `includes` and `merge` all do a single linear merge pass, which only works on sorted inputs. Vectors are fine as long as they\'re sorted, and the lengths can differ. Write the output with `std::back_inserter(out)`.',
    deepDive: {
      conceptTitle: 'Set algorithms on sorted ranges',
      details:
        'Usage: `std::set_intersection(a.begin(), a.end(), b.begin(), b.end(), std::back_inserter(out));`, which runs in O(|a| + |b|). Duplicates follow multiset semantics: each common value appears `min(countA, countB)` times. With unsorted data, a `std::unordered_set` built from one side gives O(n + m) expected time instead.',
      interviewTip: '"Intersection of two arrays": either sort both and run `set_intersection`, or hash one side. Mention the trade-off between the two.',
    },
  },
  {
    id: 'al-23',
    category: 'Algorithms & Iterators',
    difficulty: 'Quick Syntax',
    prompt: 'Which snippet gets the index of `x` in `std::vector<int> v` (or detects that it\'s missing)?',
    options: [
      '`int i = std::find(v.begin(), v.end(), x);`',
      '`auto it = std::find(v.begin(), v.end(), x); int i = (it == v.end()) ? -1 : int(it - v.begin());`',
      '`int i = v.find(x);`',
      '`int i = v.index_of(x);`',
    ],
    correctIndex: 1,
    explanation:
      '`std::find` returns an iterator, which is `end()` when `x` isn\'t found. Subtracting `begin()` turns a random-access iterator into an index. An iterator doesn\'t convert to `int`. `vector` has no `find` or `index_of` members (`std::string::find` returns an index, but vectors don\'t have it).',
    deepDive: {
      conceptTitle: 'Iterators → indices',
      details:
        '`it - v.begin()` works for random-access iterators. `std::distance(v.begin(), it)` works for any iterator, but it\'s O(n) for non-random-access ones. `std::find` is a linear scan. Use `lower_bound` on sorted data and `unordered_map<value, index>` for repeated lookups, as in "two sum".',
      interviewTip: 'Repeated `std::find` calls inside a loop are a hidden O(n²). Build a hash map once instead.',
    },
  },
  {
    id: 'al-24',
    category: 'Algorithms & Iterators',
    difficulty: 'Quick Syntax',
    prompt: 'Modified binary search on `int lo, hi`: which midpoint formula avoids signed overflow?',
    options: ['`int mid = (lo + hi) / 2;`', '`int mid = lo + (hi - lo) / 2;`', '`int mid = lo + hi / 2;`', '`int mid = (lo + hi) >> 1;`'],
    correctIndex: 1,
    explanation:
      '`lo + hi` can exceed `INT_MAX` when both are large, and signed overflow is undefined behavior. Shifting the overflowed sum has the same problem. `hi - lo` always fits when `0 <= lo <= hi`. `lo + hi / 2` gets the operator precedence wrong.',
    deepDive: {
      conceptTitle: 'Binary search template',
      details:
        'Lower-bound style: `int lo = 0, hi = n; while (lo < hi) { int mid = lo + (hi - lo) / 2; if (check(mid)) hi = mid; else lo = mid + 1; } return lo;`. This finds the first index where `check` is true. C++20 also provides `std::midpoint(lo, hi)` in `<numeric>`, which is overflow-safe. "Binary search on the answer" (e.g. minimum capacity, Koko\'s bananas) uses the same template with a monotone `check`.',
      interviewTip: 'Pick one template (half-open `[lo, hi)` is the safest) and use it every time. Mixing conventions causes off-by-one bugs.',
    },
  },
  {
    id: 'al-25',
    category: 'Algorithms & Iterators',
    difficulty: 'Quick Syntax',
    prompt: 'With prefix sums `pre` of size `n+1` (`pre[0] = 0`, `pre[i+1] = pre[i] + v[i]`), what is the sum of `v[l..r]` inclusive?',
    options: ['`pre[r] - pre[l]`', '`pre[r + 1] - pre[l]`', '`pre[r + 1] - pre[l + 1]`', '`pre[r] - pre[l - 1]`'],
    correctIndex: 1,
    explanation:
      '`pre[k]` is the sum of the first k elements, `v[0..k-1]`. So `v[l..r]` is `pre[r+1] - pre[l]`. The extra leading 0 removes the `l == 0` special case that `pre[r] - pre[l-1]` would need.',
    deepDive: {
      conceptTitle: 'Prefix sums',
      details:
        'Build: `std::vector<long long> pre(n + 1, 0); for (int i = 0; i < n; ++i) pre[i + 1] = pre[i] + v[i];`, or use `std::partial_sum(v.begin(), v.end(), pre.begin() + 1);`. Each range query is then O(1). "Subarray sum equals K" combines prefix sums with `unordered_map<long long, int> seen{{0, 1}}` and counts `seen[pre - k]`. 2D prefix sums extend the same idea with inclusion–exclusion.',
      interviewTip: 'Use `long long` for prefix sums. Summing up to 10⁵ values of 10⁹ overflows `int`.',
    },
  },
  {
    id: 'al-26',
    category: 'Algorithms & Iterators',
    difficulty: 'Quick Syntax',
    prompt: 'Group anagrams: which line makes the canonical key of `std::string w` by sorting its characters?',
    options: [
      '`std::string key = w; key.sort();`',
      '`std::string key = w; std::sort(key.begin(), key.end());`',
      '`std::string key = std::sort(w);`',
      '`std::string key = std::sorted(w.begin(), w.end());`',
    ],
    correctIndex: 1,
    explanation:
      '`std::sort` sorts a random-access range in place and returns `void`, so copy the string first and then sort the copy. `std::string` has no `sort()` member, and `std::sorted` doesn\'t exist. The C++20 form is `std::ranges::sort(key);`, which also returns an iterator, not the string.',
    deepDive: {
      conceptTitle: 'Anagram keys',
      details:
        'Then `groups[key].push_back(w);` with `std::unordered_map<std::string, std::vector<std::string>> groups;`. Sorting the key costs O(L log L) per word. A counting key such as `std::array<int, 26>` serialized to a string costs O(L) and is faster for long words. Collect the result with `for (auto& [k, g] : groups) res.push_back(std::move(g));`.',
      interviewTip: 'Moving the groups out with `std::move(g)` avoids copying every vector of strings. Mention it.',
    },
  },
  {
    id: 'al-27',
    category: 'Algorithms & Iterators',
    difficulty: 'Quick Syntax',
    prompt: 'In C++17, where is `std::gcd` and what is `std::gcd(12, 18)`?',
    options: [
      '`<cmath>`, returns `6`',
      '`<numeric>`, returns `6`',
      '`<algorithm>`, returns `36`',
      'It doesn\'t exist; use `std::__gcd`',
    ],
    correctIndex: 1,
    explanation:
      '`std::gcd` and `std::lcm` were added to `<numeric>` in C++17. gcd(12, 18) = 6, and lcm(12, 18) = 36. `std::__gcd` is an internal libstdc++ helper, not standard C++.',
    deepDive: {
      conceptTitle: 'Number utilities',
      details:
        'Useful `<numeric>` functions: `gcd`, `lcm`, `iota`, `accumulate`, `partial_sum`, `adjacent_difference`, `inner_product`, and C++20 `midpoint`. To compute the gcd of a whole array: `int g = std::accumulate(v.begin(), v.end(), 0, [](int a, int b) { return std::gcd(a, b); });` (gcd(0, x) = x). The arguments must be integers. `std::lcm` can overflow, so use `long long`.',
      interviewTip: 'Simplify a fraction with `int g = std::gcd(num, den); num /= g; den /= g;`.',
    },
  },
  {
    id: 'al-28',
    category: 'Algorithms & Iterators',
    difficulty: 'Quick Syntax',
    prompt: 'Which call sorts `std::vector<std::pair<std::string,int>> v` by the `int` (second) ascending?',
    options: [
      '`std::sort(v.begin(), v.end(), [](auto a, auto b) { return a.second <= b.second; });`',
      '`std::sort(v.begin(), v.end(), [](const auto& a, const auto& b) { return a.second < b.second; });`',
      '`std::sort(v.begin(), v.end(), &std::pair<std::string,int>::second);`',
      '`std::sort(v.begin(), v.end(), std::less<int>());`',
    ],
    correctIndex: 1,
    explanation:
      'A generic lambda (C++14 `auto` parameters) taken by `const&` avoids copying strings on every comparison and uses `<`, a strict weak ordering. The `<=` version is undefined behavior for `std::sort`, and taking `auto` by value copies both pairs. A member pointer isn\'t a comparator (a projection like that works only with `std::ranges::sort(v, {}, &P::second)`). `std::less<int>` can\'t compare pairs.',
    deepDive: {
      conceptTitle: 'Comparators & projections',
      details:
        'Pre-C++20: `std::sort(first, last, comp)` with a lambda. C++20 ranges add projections: `std::ranges::sort(v, std::less{}, &std::pair<std::string,int>::second);` or `std::ranges::sort(v, {}, [](const auto& p) { return p.second; });`. For a stable result on ties, use `std::stable_sort` or add a secondary key, e.g. `std::tie(a.second, a.first) < std::tie(b.second, b.first)`.',
      interviewTip: 'Take comparator parameters by `const auto&` by reflex. Copying strings inside a sort comparator is a silent performance killer.',
    },
  },
];

// ============================================================================
// Memory & Modern C++ — drills (pointer patterns)
// ============================================================================
export const MEMORY_DRILLS: Question[] = [
  {
    id: 'mm-16',
    category: 'Memory & Modern C++',
    difficulty: 'Quick Syntax',
    prompt: 'In-place reversal of a linked list: with `ListNode* prev = nullptr; ListNode* cur = head;`, which loop body is correct?',
    options: [
      '`cur->next = prev; prev = cur; cur = cur->next;`',
      '`ListNode* nxt = cur->next; cur->next = prev; prev = cur; cur = nxt;`',
      '`prev = cur; cur->next = prev; cur = cur->next;`',
      '`ListNode* nxt = cur->next; prev = cur; cur->next = prev; cur = nxt;`',
    ],
    correctIndex: 1,
    explanation:
      'Save `next` before you overwrite it, point `cur` back to `prev`, then advance both pointers. Without saving `nxt`, the rest of the list is lost (`cur->next` already equals `prev`). Assigning `prev = cur` before relinking makes the node point to itself. When the loop ends, `prev` is the new head.',
    deepDive: {
      conceptTitle: 'Pointer relinking',
      details:
        'Full function: `while (cur) { ListNode* nxt = cur->next; cur->next = prev; prev = cur; cur = nxt; } return prev;`. O(n) time, O(1) space. Variations: reverse a sublist between positions `m..n` (use a dummy node before `head`), and reverse in groups of k. The recursive version is O(n) stack space.',
      interviewTip: 'Use a `ListNode dummy(0, head);` sentinel whenever the head itself might change. It removes the special cases.',
    },
  },
  {
    id: 'mm-17',
    category: 'Memory & Modern C++',
    difficulty: 'Gotcha',
    prompt: 'Fast & slow pointers (find the middle or detect a cycle): which loop condition never dereferences a null pointer?',
    options: [
      '`while (fast->next && fast)`',
      '`while (fast && fast->next)`',
      '`while (fast->next->next)`',
      '`while (slow != fast)`',
    ],
    correctIndex: 1,
    explanation:
      '`&&` short-circuits from left to right, so check `fast` before reading `fast->next`. Then `fast = fast->next->next;` is safe. Reversing the order dereferences `fast` before checking it. With `slow != fast`, the loop never runs when both start at `head`, and it can still dereference null.',
    deepDive: {
      conceptTitle: 'Floyd\'s cycle detection',
      details:
        'The loop: `while (fast && fast->next) { slow = slow->next; fast = fast->next->next; if (slow == fast) return true; }`. To find where the cycle starts, reset one pointer to `head` and move both one step at a time until they meet. For the middle, `slow` ends on the second middle node of an even-length list. Start `fast = head->next` to get the first middle instead.',
      interviewTip: 'Spell out short-circuit evaluation when you write `fast && fast->next`. It shows you know why the order matters.',
    },
  },
  {
    id: 'mm-18',
    category: 'Memory & Modern C++',
    difficulty: 'Concept',
    prompt: 'Given `void f(int); void f(char*);`, what do `f(NULL)` and `f(nullptr)` call?',
    options: [
      'Both call `f(char*)`',
      '`f(NULL)` calls `f(int)` or is ambiguous (depending on how `NULL` is defined); `f(nullptr)` calls `f(char*)`',
      'Both call `f(int)`',
      'Both are compile errors',
    ],
    correctIndex: 1,
    explanation:
      '`NULL` is an integer null pointer constant (`0`, `0L`, or a compiler built-in). With `0` it\'s an exact match for `f(int)`, and with `0L` the call is ambiguous. It never prefers the pointer overload. `nullptr` has type `std::nullptr_t`, which converts only to pointer types, so it reliably picks `f(char*)`.',
    deepDive: {
      conceptTitle: 'nullptr (C++11)',
      details:
        'Always use `nullptr` for null pointers. It\'s type-safe, works with overloads and templates (a `0` passed through a template is deduced as `int`, not a pointer), and makes intent obvious. Check for null with `if (!node)` or `if (node == nullptr)`. Linked-list and tree interview code is mostly null checks, so this matters every time.',
      interviewTip: 'Writing `nullptr` instead of `NULL` or `0` is a small detail that signals modern C++ habits.',
    },
  },
];
