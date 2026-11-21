import type { Question } from '../types';
import { code } from './code';
import { ALGORITHM_DRILLS, CONTAINER_DRILLS, MEMORY_DRILLS, SYNTAX_DRILLS } from './syntaxDrills';

export type { Question };

// ============================================================================
// 1. Syntax & Methods
// ============================================================================
const SYNTAX: Question[] = [
  {
    id: 'sm-01',
    category: 'Syntax & Methods',
    difficulty: 'Quick Syntax',
    prompt: 'Given `std::vector<std::pair<int, std::string>> v;`, which call constructs the pair directly inside the vector from its constructor arguments?',
    options: ['`v.push_back(1, "a");`', '`v.emplace_back(1, "a");`', '`v.insert(1, "a");`', '`v.emplace(1, "a");`'],
    correctIndex: 1,
    explanation:
      '`emplace_back` perfectly forwards its arguments to the element\'s constructor, building the pair in place. `push_back` takes exactly one already-built element, so two arguments don\'t compile. `insert` and `emplace` both require a position iterator as their first argument, so `1` is not a valid position.',
    deepDive: {
      conceptTitle: 'push_back vs emplace_back',
      details:
        '`push_back(const T&)` / `push_back(T&&)` copy or move an existing object into the vector. `emplace_back(Args&&...)` forwards `Args` to `T`\'s constructor and constructs the element in the vector\'s storage. For types that are cheap to move, `v.push_back({1, "a"})` and `v.emplace_back(1, "a")` usually generate near-identical code. Since C++17 `emplace_back` also returns a reference to the new element.',
      interviewTip:
        'Prefer `emplace_back` when you\'d otherwise build a temporary, but beware: it can call `explicit` constructors silently (e.g. `std::vector<std::unique_ptr<T>> v; v.emplace_back(rawPtr);` compiles where `push_back(rawPtr)` would not).',
    },
  },
  {
    id: 'sm-02',
    category: 'Syntax & Methods',
    difficulty: 'Gotcha',
    prompt: 'What does this print?',
    code: code`
      std::map<std::string, int> m{{"a", 1}};
      m.insert({"a", 5});
      m.insert_or_assign("b", 2);
      m["a"] += 10;
      std::cout << m["a"] << ' ' << m.size();
    `,
    options: ['`15 2`', '`11 2`', '`11 3`', '`16 2`'],
    correctIndex: 1,
    explanation:
      '`insert` does nothing when the key already exists, so `"a"` stays `1`. `insert_or_assign` adds `"b"`. `m["a"] += 10` makes it `11`, and reading `m["a"]` again finds the existing key, so the size stays 2. It\'s not `15` or `16` because the `insert` never overwrote the `1`.',
    deepDive: {
      conceptTitle: 'map insertion semantics',
      details:
        '`insert(value)` and `emplace(args...)` never overwrite: they return `std::pair<iterator, bool>` whose `bool` is `false` if the key was present. `operator[]` default-constructs a missing value (so it needs a default-constructible `T` and can\'t be used on a `const` map). `insert_or_assign(k, v)` (C++17) inserts or overwrites and tells you which happened. `try_emplace(k, args...)` (C++17) only constructs the value if the key is absent, so it never consumes moved-from arguments on a hit.',
      interviewTip: 'Use `auto [it, inserted] = m.insert({k, v});` to both insert and detect duplicates in a single lookup.',
    },
  },
  {
    id: 'sm-03',
    category: 'Syntax & Methods',
    difficulty: 'Quick Syntax',
    prompt: 'Which condition correctly checks that `std::string s` does NOT contain `"abc"`?',
    options: [
      '`if (!s.find("abc"))`',
      '`if (s.find("abc") < 0)`',
      '`if (s.find("abc") == std::string::npos)`',
      '`if (s.find("abc") == s.end())`',
    ],
    correctIndex: 2,
    explanation:
      '`find` returns the index of the first match, or `std::string::npos` if there is none. `!s.find(...)` is true when the match is at index 0, which is the opposite of what you want. `find` returns an unsigned `size_t`, so `< 0` is always false. Comparing an index to the iterator `s.end()` doesn\'t compile.',
    deepDive: {
      conceptTitle: 'std::string::find and npos',
      details:
        '`npos` is `static const size_type npos = -1`, the largest value of `size_t`. All `find` overloads (`find`, `rfind`, `find_first_of`, …) return `npos` on failure. `npos` also means "until the end" as a length argument, e.g. `s.substr(pos, std::string::npos)`. C++23 adds `s.contains("abc")`. In C++20 you have `starts_with` / `ends_with`.',
      interviewTip: 'Store the result in a `size_t` (or `auto`). Storing it in an `int` gives a narrowing conversion that hides `npos`.',
    },
  },
  {
    id: 'sm-04',
    category: 'Syntax & Methods',
    difficulty: 'Gotcha',
    prompt: 'The input is `42⏎Alice⏎`. What is `name` after this code runs?',
    code: code`
      int n;
      std::string name;
      std::cin >> n;
      std::getline(std::cin, name);
    `,
    options: ['`"Alice"`', '`""` (empty string)', '`"42"`', '`"\\nAlice"`'],
    correctIndex: 1,
    explanation:
      '`cin >> n` reads `42` and stops at the newline, leaving it in the buffer. `getline` then reads up to that newline right away and returns an empty line. `"Alice"` is still waiting in the stream.',
    deepDive: {
      conceptTitle: 'Mixing >> and getline',
      details:
        'Formatted extraction (`>>`) skips leading whitespace but leaves trailing whitespace, including the `\\n`, in the stream. `std::getline` does not skip leading whitespace: it reads characters until the delimiter and discards the delimiter. To fix it, use `std::getline(std::cin >> std::ws, name);`, or call `std::cin.ignore(std::numeric_limits<std::streamsize>::max(), \'\\n\');` before `getline`.',
      interviewTip: 'In online judges, reading every line with `getline` and parsing with `std::istringstream` avoids this whole class of bugs.',
    },
  },
  {
    id: 'sm-05',
    category: 'Syntax & Methods',
    difficulty: 'Quick Syntax',
    prompt: 'You want to double every value in `std::map<std::string, int> m` in place. Which loop works?',
    options: [
      '`for (auto [k, v] : m) v *= 2;`',
      '`for (auto& [k, v] : m) v *= 2;`',
      '`for (auto& (k, v) : m) v *= 2;`',
      '`for (const auto& [k, v] : m) v *= 2;`',
    ],
    correctIndex: 1,
    explanation:
      '`auto&` binds the structured binding to the real map element, so `v` refers to the stored value. Plain `auto` binds to a copy of each pair, so the map never changes. Parentheses are not structured-binding syntax. The `const auto&` version doesn\'t compile because `v` is const.',
    deepDive: {
      conceptTitle: 'Structured bindings (C++17)',
      details:
        '`auto [a, b] = expr;` introduces names bound to the members of a hidden object. The `auto`/`auto&`/`const auto&` qualifier applies to that hidden object, not to each name. A map\'s `value_type` is `std::pair<const Key, T>`, so `k` is always `const` even with `auto&`. Structured bindings work with arrays, tuple-like types (`pair`, `tuple`, `array`), and structs with all-public members.',
      interviewTip: '`for (const auto& [key, count] : freq)` is the idiomatic read-only loop over a frequency map.',
    },
  },
  {
    id: 'sm-06',
    category: 'Syntax & Methods',
    difficulty: 'Concept',
    prompt: 'What does this print?',
    code: code`
      int x = 1;
      auto byValue = [x]() { return x; };
      auto byRef   = [&x]() { return x; };
      x = 10;
      std::cout << byValue() << ' ' << byRef();
    `,
    options: ['`1 1`', '`1 10`', '`10 10`', '`10 1`'],
    correctIndex: 1,
    explanation:
      '`[x]` copies `x` when the lambda is created, so it holds `1` forever. `[&x]` stores a reference, so it sees the later assignment and returns `10`.',
    deepDive: {
      conceptTitle: 'Lambda capture modes',
      details:
        '`[x]` copies at creation time. `[&x]` captures by reference. `[=]` and `[&]` are capture defaults for every variable the body uses. `[this]` captures the object pointer, and `[*this]` (C++17) copies the whole object. Init-captures such as `[p = std::move(ptr)]` or `[n = x + 1]` (C++14) let you move or compute values into the closure. A by-reference capture must not outlive the variable it refers to.',
      interviewTip: 'Returning a lambda that captures a local by reference is a classic dangling bug. Capture by value or with an init-capture instead.',
    },
  },
  {
    id: 'sm-07',
    category: 'Syntax & Methods',
    difficulty: 'Gotcha',
    prompt: 'What happens with this code?',
    code: code`
      int c = 0;
      auto inc = [c]() { return ++c; };
      std::cout << inc();
    `,
    options: [
      'It prints `1` and the outer `c` becomes `1`',
      'Compile error: a by-copy capture is `const` inside a non-`mutable` lambda',
      'It prints `1`, and the outer `c` stays `0`',
      'Undefined behavior',
    ],
    correctIndex: 1,
    explanation:
      'A lambda\'s `operator()` is `const` by default, so members captured by copy are read-only and `++c` fails to compile. If you write `[c]() mutable { return ++c; }`, it compiles, prints `1`, and changes only the closure\'s own copy, so the outer `c` stays `0`.',
    deepDive: {
      conceptTitle: 'mutable lambdas',
      details:
        'A lambda is an unnamed class whose captured variables are data members and whose body is a `const` member `operator()`. `mutable` removes that `const`, so the copies can change, and the changes persist across calls of the same closure object. References captured with `[&]` can always modify the referenced variable, because constness doesn\'t propagate through references.',
      interviewTip: 'Want a stateful counter generator? `[n = 0]() mutable { return n++; }` is the idiom.',
    },
  },
  {
    id: 'sm-08',
    category: 'Syntax & Methods',
    difficulty: 'Quick Syntax',
    prompt: 'Which loop over `std::vector<std::string> words` avoids copying each string AND prevents modifying it?',
    options: [
      '`for (auto s : words)`',
      '`for (auto& s : words)`',
      '`for (const auto& s : words)`',
      '`for (const auto s : words)`',
    ],
    correctIndex: 2,
    explanation:
      '`const auto&` binds a read-only reference to each element, so nothing is copied and nothing can be modified. `auto` and `const auto` both copy every string. `auto&` avoids the copy but allows modification.',
    deepDive: {
      conceptTitle: 'Range-based for loop forms',
      details:
        '`for (decl : range)` expands to a loop over `begin(range)`/`end(range)` with `decl = *it`. Use `const auto&` for read-only access to non-trivial types, `auto&` to modify in place, plain `auto` for cheap scalars like `int` or when you want a copy, and `auto&&` in generic code (it also binds to proxy objects like `std::vector<bool>::reference`). C++20 allows an init-statement: `for (auto v = get(); auto& x : v)`.',
      interviewTip: 'Writing `for (auto s : words)` on strings is an easy "unnecessary copy" flag for a reviewer. Say `const auto&` out loud.',
    },
  },
  {
    id: 'sm-09',
    category: 'Syntax & Methods',
    difficulty: 'Concept',
    prompt:
      'Inside a member function of `class Counter { int count_; ... };`, which capture list compiles and lets the lambda read and modify `count_`, while making the dependence on the object explicit?',
    options: ['`[count_]() { ++count_; }`', '`[this]() { ++count_; }`', '`[&count_]() { ++count_; }`', '`[]() { ++count_; }`'],
    correctIndex: 1,
    explanation:
      'Data members aren\'t local variables and can\'t be captured by name, so `[count_]` and `[&count_]` don\'t compile. The lambda reaches members through `this`, which you capture explicitly with `[this]`. An empty capture list has no access to `this` at all.',
    deepDive: {
      conceptTitle: 'Capturing this',
      details:
        '`[this]` captures the object pointer. The lambda then uses `this->count_` implicitly and must not outlive the object. `[*this]` (C++17) copies the whole object into the closure, which is safe for async callbacks. Implicit capture of `this` through `[=]` is deprecated in C++20, so write `[=, this]`. To copy just one member, use an init-capture: `[c = count_]`.',
      interviewTip: 'If a lambda is stored or run asynchronously (for example by a thread pool), say whether `[this]` can dangle. Interviewers listen for that.',
    },
  },
  {
    id: 'sm-10',
    category: 'Syntax & Methods',
    difficulty: 'Quick Syntax',
    prompt: 'What does this print?',
    code: code`
      std::string s = "interview";
      std::cout << s.substr(2, 4);
    `,
    options: ['`te`', '`ter`', '`terv`', '`tervi`'],
    correctIndex: 2,
    explanation:
      'The second argument of `substr` is a length, not an end index. Starting at index 2 (`t`), it takes 4 characters: `t e r v`.',
    deepDive: {
      conceptTitle: 'substr(pos, count)',
      details:
        '`basic_string::substr(pos = 0, count = npos)` returns a new string of `min(count, size() - pos)` characters starting at `pos`. It throws `std::out_of_range` if `pos > size()` (`pos == size()` is fine and gives `""`). It allocates a new string. For zero-copy slicing, use `std::string_view::substr`, which has the same signature and is O(1).',
      interviewTip: 'To slice `[l, r)` from indices, write `s.substr(l, r - l)`.',
    },
  },
  {
    id: 'sm-11',
    category: 'Syntax & Methods',
    difficulty: 'Quick Syntax',
    prompt: 'In C++20, which is the idiomatic way to check whether `key` exists in a `std::unordered_map<std::string, int> m` without modifying it?',
    options: ['`if (m[key])`', '`if (m.contains(key))`', '`if (m.find(key))`', '`if (m.has(key))`'],
    correctIndex: 1,
    explanation:
      'C++20 added `contains()` to all associative containers. `m[key]` inserts a value-initialized entry when the key is missing, and a stored `0` looks like "absent". `find` returns an iterator, which doesn\'t convert to `bool`, so you\'d need `m.find(key) != m.end()`. `has` doesn\'t exist.',
    deepDive: {
      conceptTitle: 'Membership tests',
      details:
        'Before C++20 you wrote `m.count(key) > 0`, or `m.find(key) != m.end()` when you also need the value, since that\'s one lookup instead of two. `count` is O(1) average for unordered containers and O(log n) for ordered ones. `std::set`, `std::multimap` and the other associative containers have `contains` too. When you need the value as well, keep the iterator from `find` rather than calling `contains` and then `at`.',
      interviewTip: '`if (auto it = m.find(k); it != m.end()) use(it->second);` (C++17 if-with-initializer) does one lookup and scopes `it` neatly.',
    },
  },
  {
    id: 'sm-12',
    category: 'Syntax & Methods',
    difficulty: 'Gotcha',
    prompt: 'What does `std::stoi("42abc")` do?',
    options: [
      'Throws `std::invalid_argument`',
      'Returns `42`',
      'Returns `0`',
      'Undefined behavior',
    ],
    correctIndex: 1,
    explanation:
      '`stoi` parses the longest valid integer prefix and ignores the rest, so it returns `42`. It throws `std::invalid_argument` only if no conversion is possible at all (e.g. `"abc"`), and `std::out_of_range` if the value doesn\'t fit in an `int`.',
    deepDive: {
      conceptTitle: 'String → number conversions',
      details:
        '`std::stoi(str, size_t* pos = nullptr, int base = 10)` skips leading whitespace and stores the number of characters consumed in `*pos`. That lets you detect trailing junk: `size_t p; int v = std::stoi(s, &p); bool whole = (p == s.size());`. The family also includes `stol`, `stoll`, `stoul`, `stod`. For non-throwing, allocation-free parsing, C++17 `std::from_chars` returns an error code and a pointer to the first unparsed character.',
      interviewTip: 'For input validation, say you\'d check `pos == s.size()` or use `std::from_chars`. It shows you know `stoi` accepts partial input.',
    },
  },
  {
    id: 'sm-13',
    category: 'Syntax & Methods',
    difficulty: 'Gotcha',
    prompt: 'In C++17, what are the deduced types of `a` and `b`?',
    code: code`
      auto a = {1, 2, 3};
      auto b{5};
    `,
    options: [
      '`std::vector<int>` and `int`',
      '`std::initializer_list<int>` and `int`',
      '`std::initializer_list<int>` and `std::initializer_list<int>`',
      '`int[3]` and `int`',
    ],
    correctIndex: 1,
    explanation:
      'Copy-list-initialization with `auto x = {…}` always deduces `std::initializer_list<T>`. Since C++17 (rule N3922), direct-list-initialization `auto x{expr}` with a single element deduces the element type, `int`. Before that rule, `b` was also an `initializer_list`.',
    deepDive: {
      conceptTitle: 'auto + braced initializers',
      details:
        '`auto x = {1, 2};` gives `initializer_list<int>`. `auto x = {1, 2.0};` is an error (conflicting types). `auto x{1};` gives `int`, and `auto x{1, 2};` is an error. `auto` never deduces a container type such as `std::vector`. If you want a vector, write `std::vector v{1, 2, 3};`, where class template argument deduction (CTAD, C++17) gives `std::vector<int>`.',
      interviewTip: 'When in doubt, use `auto x = 5;` for scalars and name the container type explicitly.',
    },
  },
  {
    id: 'sm-14',
    category: 'Syntax & Methods',
    difficulty: 'Gotcha',
    prompt: 'What are the contents of `a` and `b`?',
    code: code`
      std::vector<int> a(3, 5);
      std::vector<int> b{3, 5};
    `,
    options: [
      '`a = {5, 5, 5}`, `b = {3, 5}`',
      '`a = {3, 5}`, `b = {5, 5, 5}`',
      'Both are `{5, 5, 5}`',
      'Both are `{3, 5}`',
    ],
    correctIndex: 0,
    explanation:
      'Parentheses call the `(count, value)` constructor: three copies of 5. Braces prefer the `std::initializer_list` constructor whenever it can be used, so `b` holds exactly the elements 3 and 5.',
    deepDive: {
      conceptTitle: 'Brace vs parenthesis initialization',
      details:
        'During overload resolution for list-initialization, constructors that take `std::initializer_list<T>` win whenever they can be called. That\'s why `std::vector<int>{10}` has one element (10) while `std::vector<int>(10)` has ten zeros. The same trap applies to `std::string(3, \'x\')` ("xxx") vs `std::string{3, \'x\'}` (two characters: `\\x03` and `x`).',
      interviewTip: 'To size a 2D grid, write `std::vector<std::vector<int>> g(rows, std::vector<int>(cols, 0));`. Parentheses, not braces.',
    },
  },
  {
    id: 'sm-15',
    category: 'Syntax & Methods',
    difficulty: 'Quick Syntax',
    prompt: 'What is the value of `d`?',
    code: code`
      int a = 7, b = 2;
      double d = a / b;
    `,
    options: ['`3.5`', '`3.0`', '`4.0`', 'Compile error: narrowing conversion'],
    correctIndex: 1,
    explanation:
      'Both operands are `int`, so `/` does integer division and truncates toward zero to `3`. Only then is the result converted to `double`, giving `3.0`. Copy-initializing a `double` from an `int` with `=` is not a narrowing error (only brace-init checks narrowing, and int → double isn\'t flagged here anyway).',
    deepDive: {
      conceptTitle: 'Integer division & promotions',
      details:
        'The type of an arithmetic expression comes from its operands, not from the variable that receives the result. Integer `/` truncates toward zero (`-7 / 2 == -3`), and `%` takes the sign of the dividend (`-7 % 2 == -1`). To divide in floating point, convert one operand first: `static_cast<double>(a) / b`. For ceiling division of positive ints, use `(a + b - 1) / b`.',
      interviewTip: 'For averages and midpoints, `lo + (hi - lo) / 2` avoids overflow, and `static_cast<double>(sum) / n` avoids truncation.',
    },
  },
];

// ============================================================================
// 2. STL Containers & Complexity
// ============================================================================
const CONTAINERS: Question[] = [
  {
    id: 'st-01',
    category: 'STL Containers',
    difficulty: 'Gotcha',
    prompt: 'What is the behavior of this code?',
    code: code`
      std::vector<int> v{1, 2, 3};
      int& first = v[0];
      v.push_back(4);
      std::cout << first;
    `,
    options: [
      'Always prints `1`',
      'Undefined behavior: `push_back` may reallocate and invalidate `first`',
      'Compile error: can\'t bind a reference to `v[0]`',
      'Prints `4`',
    ],
    correctIndex: 1,
    explanation:
      'If `size() == capacity()` (very likely after `{1, 2, 3}`), `push_back` allocates a new buffer, moves the elements, and frees the old one. `first` then refers to freed memory. Even when it happens to print 1, reading it is undefined behavior.',
    deepDive: {
      conceptTitle: 'vector iterator & reference invalidation',
      details:
        'On reallocation, every iterator, pointer and reference into the vector is invalidated. Without reallocation, `push_back`/`insert` invalidate only `end()` and anything at or after the insertion point. `erase` invalidates everything at or after the erased position. `reserve(n)` up front guarantees no reallocation until `size()` exceeds `n`.',
      interviewTip: 'If you keep indices instead of references or iterators while appending to a vector, you never have to worry about reallocation.',
    },
  },
  {
    id: 'st-02',
    category: 'STL Containers',
    difficulty: 'Concept',
    prompt: 'What is the time complexity of `std::vector::push_back`?',
    options: ['O(1) worst case', 'Amortized O(1)', 'O(log n)', 'O(n) every call'],
    correctIndex: 1,
    explanation:
      'Most calls write into spare capacity in O(1). When capacity runs out, the vector grows geometrically (×1.5 or ×2) and copies or moves all elements in O(n). Because the growth is geometric, the total over n pushes is O(n), so each push costs O(1) amortized. A single call can still be O(n), so the worst case is not O(1).',
    deepDive: {
      conceptTitle: 'Amortized analysis of dynamic arrays',
      details:
        'With growth factor g, the elements copied across n pushes total about n · (1 + 1/g + 1/g² + …) = O(n). Additive growth (+k each time) would make n pushes cost O(n²). On reallocation, the vector uses the element\'s move constructor only if it is `noexcept`. Otherwise it copies, to keep the strong exception guarantee.',
      interviewTip: 'Mark your move constructors `noexcept`, or `std::vector` will silently copy your objects when it grows.',
    },
  },
  {
    id: 'st-03',
    category: 'STL Containers',
    difficulty: 'Gotcha',
    prompt: 'What happens here?',
    code: code`
      std::vector<int> v;
      v.reserve(10);
      v[0] = 5;
      std::cout << v.size();
    `,
    options: [
      'Prints `1`',
      'Prints `10`',
      'Undefined behavior: `reserve` doesn\'t change `size()`, so `v[0]` is out of range',
      'Throws `std::out_of_range`',
    ],
    correctIndex: 2,
    explanation:
      '`reserve` only allocates capacity. `size()` is still 0, so `v[0]` accesses an element that doesn\'t exist. `operator[]` does no bounds check, so this is undefined behavior, not an exception. `v.at(0)` would throw `std::out_of_range`.',
    deepDive: {
      conceptTitle: 'reserve vs resize',
      details:
        '`reserve(n)` changes capacity only. It constructs no elements and doesn\'t change `size()`. `resize(n)` changes `size()`, value-initializing new elements (zeros for `int`) or destroying extra ones. Use `reserve` followed by `push_back`/`emplace_back` when you\'ll append, and `resize` (or the `vector<T>(n)` constructor) when you\'ll assign by index.',
      interviewTip: 'Pair `reserve` with `push_back`, or `resize` with `operator[]`. Mixing them is the bug.',
    },
  },
  {
    id: 'st-04',
    category: 'STL Containers',
    difficulty: 'Concept',
    prompt: 'Which correctly describes lookup complexity for `std::unordered_map` vs `std::map`?',
    options: [
      '`unordered_map`: O(1) average, O(n) worst; `map`: O(log n)',
      'Both are O(log n)',
      '`unordered_map`: O(1) worst case; `map`: O(log n)',
      '`unordered_map`: O(log n); `map`: O(1) average',
    ],
    correctIndex: 0,
    explanation:
      '`unordered_map` is a hash table: O(1) on average, but O(n) when many keys collide in one bucket. `std::map` is a balanced binary search tree (in practice a red-black tree) with a guaranteed O(log n) for lookup, insert and erase.',
    deepDive: {
      conceptTitle: 'Hash table vs balanced BST',
      details:
        'Choose `std::map` when you need ordered iteration, `lower_bound`/`upper_bound` range queries, or guaranteed worst-case bounds. Choose `unordered_map` for raw average-case speed. The hash table rehashes when `size() / bucket_count()` exceeds `max_load_factor()` (default 1.0). Rehashing invalidates iterators but not references or pointers to elements. Calling `reserve(n)` up front avoids repeated rehashes.',
      interviewTip: 'Adversarial inputs can force O(n) collisions on `unordered_map` with `std::hash<int>`. In competitive settings, say you would add a randomized custom hash.',
    },
  },
  {
    id: 'st-05',
    category: 'STL Containers',
    difficulty: 'Concept',
    prompt: '`struct Point { int x, y; };` — what must you provide for `std::unordered_map<Point, int>` to compile?',
    options: [
      'Only `operator<` for `Point`',
      'A hash function (e.g. a `std::hash<Point>` specialization or a hasher type) AND equality (`operator==` or a key-equal type)',
      'Nothing: aggregates are hashed member-wise automatically',
      'Only a default constructor',
    ],
    correctIndex: 1,
    explanation:
      'Unordered containers need `Hash` to pick a bucket and `KeyEqual` (by default `std::equal_to`, which calls `operator==`) to compare keys within a bucket. The standard library provides no automatic hashing for user types. `operator<` is what an ordered `std::map` needs.',
    deepDive: {
      conceptTitle: 'Custom hash requirements',
      details:
        'Equal keys must produce equal hashes. One option is to specialize `template<> struct std::hash<Point> { size_t operator()(const Point& p) const noexcept { ... } };`. The other is to pass a functor: `std::unordered_map<Point, int, PointHash>`. Combine member hashes with mixing, e.g. `h1 ^ (h2 + 0x9e3779b9 + (h1 << 6) + (h1 >> 2))`. Plain XOR maps `(1,2)` and `(2,1)` to the same hash. Since C++20, `bool operator==(const Point&) const = default;` gives you equality in one line.',
      interviewTip: 'For a pair of ints, packing into one 64-bit key (`(int64_t)x << 32 | (uint32_t)y`) avoids writing a hash at all.',
    },
  },
  {
    id: 'st-06',
    category: 'STL Containers',
    difficulty: 'Gotcha',
    prompt: 'Why does this fail to compile?',
    code: code`
      int lookup(const std::map<std::string, int>& m) {
          return m["key"];
      }
    `,
    options: [
      'String literals can\'t be map keys',
      '`operator[]` is non-`const`: it may insert a missing key',
      '`std::map` has no `operator[]`',
      'Returning `int` from a `map` lookup requires a cast',
    ],
    correctIndex: 1,
    explanation:
      '`operator[]` inserts a default value when the key is missing, so it exists only as a non-const member and can\'t be called on a `const&`. Use `m.at("key")` (throws `std::out_of_range` if absent) or `find`.',
    deepDive: {
      conceptTitle: 'Read-only map access',
      details:
        'For a const map you have three options. `at(k)` is checked and throws. `find(k)` returns `end()` if the key is absent. `contains(k)` (C++20) is a plain membership test. The side effect of `operator[]` also bites in non-const code: `if (m[k] == 0)` silently grows the map with every probe. The same applies to `std::unordered_map`.',
      interviewTip: 'Pass maps by `const&` and use `find`. Reaching for `[]` on a const map is a common slip in live coding.',
    },
  },
  {
    id: 'st-07',
    category: 'STL Containers',
    difficulty: 'Quick Syntax',
    prompt: 'What does this print?',
    code: code`
      std::priority_queue<int> pq;
      for (int x : {3, 1, 4, 1, 5}) pq.push(x);
      pq.pop();
      std::cout << pq.top();
    `,
    options: ['`1`', '`4`', '`5`', '`3`'],
    correctIndex: 1,
    explanation:
      '`std::priority_queue` is a max-heap by default (it uses `std::less<T>`). The largest element `5` is on top. `pop()` removes it, so `top()` is now `4`.',
    deepDive: {
      conceptTitle: 'priority_queue basics',
      details:
        '`std::priority_queue<T, Container = std::vector<T>, Compare = std::less<T>>` is an adaptor over a binary heap. `top()` is O(1), `push`/`pop` are O(log n), and building from a range in the constructor is O(n). It has no iteration, no `find`, and no decrease-key. In Dijkstra you push duplicates and skip stale entries when you pop them.',
      interviewTip: 'For "k largest elements", keep a min-heap of size k: push each element, and pop whenever the size exceeds k. That gives O(n log k).',
    },
  },
  {
    id: 'st-08',
    category: 'STL Containers',
    difficulty: 'Quick Syntax',
    prompt: 'Which declaration creates a min-heap of `int`?',
    options: [
      '`std::priority_queue<int, std::greater<int>> pq;`',
      '`std::priority_queue<int, std::vector<int>, std::greater<int>> pq;`',
      '`std::priority_queue<int, std::vector<int>, std::less<int>> pq;`',
      '`std::min_heap<int> pq;`',
    ],
    correctIndex: 1,
    explanation:
      'The comparator is the third template parameter, so you must also spell out the container. Putting `std::greater<int>` second makes it the container type, which fails to compile. `std::less` is the default max-heap. `std::min_heap` doesn\'t exist.',
    deepDive: {
      conceptTitle: 'Heap ordering with comparators',
      details:
        'The heap keeps on top the element that compares "greatest" under `Compare`. With `std::greater`, "greatest" means the numerically smallest, so you get a min-heap. `std::greater<>` (transparent, C++14) also works and deduces types. For pairs such as `(dist, node)` in Dijkstra, `std::greater<std::pair<int, int>>` orders lexicographically by `dist` first.',
      interviewTip: 'A quick alternative min-heap trick: push `-x` into a max-heap and negate on `top()`. It works for ints, but watch for `INT_MIN`.',
    },
  },
  {
    id: 'st-09',
    category: 'STL Containers',
    difficulty: 'Gotcha',
    prompt: 'What does this print?',
    code: code`
      auto cmp = [](int a, int b) { return a > b; };
      std::priority_queue<int, std::vector<int>, decltype(cmp)> pq(cmp);
      pq.push(5); pq.push(1); pq.push(8);
      std::cout << pq.top();
    `,
    options: ['`8`', '`1`', '`5`', 'Compile error: lambdas can\'t be comparators'],
    correctIndex: 1,
    explanation:
      'The comparator answers "does `a` have lower priority than `b`?". With `a > b`, larger numbers rank lower, so the smallest value `1` comes out on top. This lambda builds a min-heap. Passing `cmp` to the constructor is required before C++20, because closure types weren\'t default-constructible until then.',
    deepDive: {
      conceptTitle: 'Comparator semantics are inverted for heaps',
      details:
        'For `std::sort`, `comp(a, b) == true` means `a` goes before `b`. For `priority_queue`, the same comparator puts the element that sorts last on top. That\'s why `less` gives a max-heap. Sorted ascending by `less`, the max is the last element, and the top is the last element in comparator order. Whatever comparator you use must be a strict weak ordering.',
      interviewTip: 'Remember it this way: the comparator says which element sinks. `a > b` means larger values sink, so the smallest is on top.',
    },
  },
  {
    id: 'st-10',
    category: 'STL Containers',
    difficulty: 'Concept',
    prompt: 'Which container offers O(1) random access by index AND amortized O(1) insertion at the front?',
    options: ['`std::vector`', '`std::deque`', '`std::list`', '`std::forward_list`'],
    correctIndex: 1,
    explanation:
      '`std::deque` stores elements in fixed-size blocks with a block map, which gives O(1) `operator[]` and O(1) `push_front`/`push_back`. `vector::insert(begin())` is O(n). `list` and `forward_list` have no random access: reaching index i takes O(i).',
    deepDive: {
      conceptTitle: 'deque vs list vs vector',
      details:
        '`deque`: random access, cheap insertion at both ends, and insertion at the ends never invalidates references to existing elements (iterators are still invalidated). Its memory is not contiguous, so it has no `data()`. `list`: a doubly linked list with O(1) insert and erase anywhere given an iterator, O(1) `splice`, stable iterators, and poor cache locality. `vector`: contiguous memory with the best cache behavior, and the right default in most cases.',
      interviewTip: 'BFS queue or sliding-window deque? Use `std::deque` (or `std::queue`, which uses a deque internally).',
    },
  },
  {
    id: 'st-11',
    category: 'STL Containers',
    difficulty: 'Concept',
    prompt: 'Inserting or erasing an element in which container never invalidates iterators to OTHER elements?',
    options: ['`std::vector`', '`std::deque`', '`std::list`', '`std::unordered_map`'],
    correctIndex: 2,
    explanation:
      'List nodes are separately allocated and never move, so only iterators to an erased node become invalid. A vector shifts or reallocates its elements. A deque invalidates all iterators on any insertion. An `unordered_map` can rehash on insert, which invalidates all its iterators, although references to elements stay valid.',
    deepDive: {
      conceptTitle: 'Node-based containers',
      details:
        '`std::list`, `std::forward_list`, `std::map`/`std::set` (and their multi variants) are node-based: insertion never invalidates anything, and erasure invalidates only the erased element. That stability is why an LRU cache combines `std::list<Key>` with `unordered_map<Key, list::iterator>`. A list iterator stays valid even while you `splice` its node to the front.',
      interviewTip: 'In the LRU cache question, say why `list::iterator` can safely live inside the hash map: list iterators are never invalidated by other operations.',
    },
  },
  {
    id: 'st-12',
    category: 'STL Containers',
    difficulty: 'Gotcha',
    prompt: 'For `std::set<int> s` with n elements, what is the complexity of `std::lower_bound(s.begin(), s.end(), x)` vs `s.lower_bound(x)`?',
    options: [
      'Both O(log n)',
      '`std::lower_bound`: O(n) iterator steps; `s.lower_bound`: O(log n)',
      '`std::lower_bound` doesn\'t compile on sets',
      '`std::lower_bound`: O(log n); `s.lower_bound`: O(n)',
    ],
    correctIndex: 1,
    explanation:
      '`std::lower_bound` makes only O(log n) comparisons, but set iterators are bidirectional, so each "jump to the middle" walks the iterator step by step. That adds up to O(n) increments. The member `s.lower_bound(x)` walks the tree directly in O(log n).',
    deepDive: {
      conceptTitle: 'Member vs free algorithms',
      details:
        'The free binary-search algorithms reach their O(log n) bound only with random-access iterators (`vector`, `deque`, arrays). Associative containers provide member versions (`lower_bound`, `upper_bound`, `equal_range`, `find`, `count`) that use the tree structure. The same rule applies to `std::find` on a set, which is O(n), versus `s.find(x)` in O(log n). `std::list` has its own member `sort` because `std::sort` needs random access.',
      interviewTip: 'Always prefer the member function when a container provides one with the same name as an algorithm.',
    },
  },
  {
    id: 'st-13',
    category: 'STL Containers',
    difficulty: 'Concept',
    prompt: 'Which loop correctly erases all odd keys from `std::map<int, int> m` while iterating?',
    options: [
      '`for (auto it = m.begin(); it != m.end(); ++it) if (it->first % 2) m.erase(it);`',
      '`for (auto it = m.begin(); it != m.end(); ) { if (it->first % 2) it = m.erase(it); else ++it; }`',
      '`for (auto& [k, v] : m) if (k % 2) m.erase(k);`',
      '`for (auto it = m.begin(); it != m.end(); ++it) if (it->first % 2) it = m.erase(it);`',
    ],
    correctIndex: 1,
    explanation:
      '`erase(it)` returns the iterator to the next element, and you advance only when you didn\'t erase. Incrementing an erased iterator is undefined behavior. The range-for version erases the current element out from under the loop. Assigning `it = m.erase(it)` and then also doing `++it` skips elements and can step past `end()`.',
    deepDive: {
      conceptTitle: 'Erase-while-iterating pattern',
      details:
        'Since C++11, `erase(iterator)` on every standard container returns the next valid iterator, so `it = c.erase(it)` is the universal pattern. C++20 offers `std::erase_if(m, [](const auto& kv) { return kv.first % 2; });` for all standard containers, including maps and sets, which removes the manual loop.',
      interviewTip: 'Mention `std::erase_if` (C++20) first, then show the manual loop if they want to see it.',
    },
  },
  {
    id: 'st-14',
    category: 'STL Containers',
    difficulty: 'Quick Syntax',
    prompt: 'Why doesn\'t this compile?',
    code: code`
      std::stack<int> st;
      st.push(1);
      int x = st.pop();
    `,
    options: [
      '`std::stack` has no `push`, only `emplace`',
      '`pop()` returns `void`: read the value with `top()` first, then call `pop()`',
      '`std::stack` needs an explicit container argument',
      '`pop()` returns an iterator, not an `int`',
    ],
    correctIndex: 1,
    explanation:
      '`std::stack::pop`, `std::queue::pop` and `std::priority_queue::pop` all return `void`. Read with `top()` (stack, priority_queue) or `front()` (queue) before popping. This design keeps the operation exception-safe: returning by value could throw after the element was already removed.',
    deepDive: {
      conceptTitle: 'Container adaptors',
      details:
        '`std::stack` (LIFO) defaults to a `std::deque`. Its interface is `push`, `emplace`, `pop`, `top`, `empty`, `size`. `std::queue` (FIFO) uses `front` and `back` instead of `top`. Neither supports iteration or `clear()` (assign `st = {}` to clear). You can choose the underlying container, e.g. `std::stack<int, std::vector<int>>`.',
      interviewTip: 'The muscle-memory pair is `int x = st.top(); st.pop();`. Check `empty()` first, because `top()` on an empty stack is undefined behavior.',
    },
  },
  {
    id: 'st-15',
    category: 'STL Containers',
    difficulty: 'Gotcha',
    prompt: 'What does this print?',
    code: code`
      std::multiset<int> ms{1, 2, 2, 2, 3};
      ms.erase(2);
      std::cout << ms.size();
    `,
    options: ['`4`', '`2`', '`3`', '`5`'],
    correctIndex: 1,
    explanation:
      '`erase(key)` removes every element equal to the key (and returns how many it removed: 3). Only `1` and `3` remain. To remove a single copy, use `ms.erase(ms.find(2));`, after checking that `find` didn\'t return `end()`.',
    deepDive: {
      conceptTitle: 'erase(key) vs erase(iterator)',
      details:
        'For associative containers, `erase(const key_type&)` removes all matching elements and returns a `size_type` count. `erase(iterator)` removes exactly one element and returns the next iterator. With a multiset/multimap used as a sliding-window "sorted bag", erasing by key is a classic bug that drops duplicates. Calling `erase(end())` is undefined behavior.',
      interviewTip: 'For a sliding-window median or max, write `ms.erase(ms.find(outgoing));` explicitly and say why.',
    },
  },
];

// ============================================================================
// 3. Algorithms & Iterators
// ============================================================================
const ALGORITHMS: Question[] = [
  {
    id: 'al-01',
    category: 'Algorithms & Iterators',
    difficulty: 'Gotcha',
    prompt: 'What is wrong with this call?',
    code: code`
      std::sort(v.begin(), v.end(), [](int a, int b) {
          return a <= b;
      });
    `,
    options: [
      'Nothing: it sorts ascending',
      'It sorts descending',
      'Undefined behavior: `<=` is not a strict weak ordering (`comp(a, a)` must be false)',
      'Compile error: comparators must be function pointers',
    ],
    correctIndex: 2,
    explanation:
      '`std::sort` requires `comp(a, a) == false` (irreflexivity). With `<=`, equal elements compare "less" in both directions. Real implementations can then read past the end of the range and crash, especially when there are many duplicates. Use `<`.',
    deepDive: {
      conceptTitle: 'Strict weak ordering',
      details:
        'A valid comparator must be irreflexive (`!comp(a, a)`), asymmetric (`comp(a, b)` implies `!comp(b, a)`), transitive, and its incomparability ("equivalence") must be transitive too. `std::sort`, `std::set`, `std::map`, `priority_queue`, `lower_bound` and the others all depend on these properties. For multi-key sorts, `std::tie(a.x, a.y) < std::tie(b.x, b.y)` gives a correct lexicographic comparison.',
      interviewTip: 'Write comparators with `<` or `>` only, never `<=` or `>=`. For descending order, use `return a > b;`.',
    },
  },
  {
    id: 'al-02',
    category: 'Algorithms & Iterators',
    difficulty: 'Concept',
    prompt: 'For `v = {1, 2, 4, 4, 4, 7}`, what are `lower_bound(v.begin(), v.end(), 4) - v.begin()` and `upper_bound(v.begin(), v.end(), 4) - v.begin()`?',
    options: ['`2` and `5`', '`2` and `4`', '`3` and `5`', '`2` and `6`'],
    correctIndex: 0,
    explanation:
      '`lower_bound` returns the first element not less than 4 (`>= 4`), at index 2. `upper_bound` returns the first element greater than 4, which is `7` at index 5. Their difference, 3, is the number of 4s.',
    deepDive: {
      conceptTitle: 'lower_bound / upper_bound / equal_range',
      details:
        'Both are O(log n) on random-access ranges that are sorted (more precisely, partitioned) with respect to the value. `[lower_bound, upper_bound)` is the range of elements equal to the value, and `std::equal_range` returns both iterators in one call. To find the last element `<= x`, use `std::prev(upper_bound(x))` after checking it isn\'t `begin()`. To find the first element `> x`, use `upper_bound(x)`.',
      interviewTip: 'Count occurrences in a sorted array in O(log n) with `upper_bound - lower_bound`.',
    },
  },
  {
    id: 'al-03',
    category: 'Algorithms & Iterators',
    difficulty: 'Concept',
    prompt: 'For `std::vector<int> v{1, 3, 5}`, what does `std::lower_bound(v.begin(), v.end(), 9)` return?',
    options: [
      'An iterator to `5` (the closest element)',
      '`v.end()`: you must check before dereferencing',
      'It throws `std::out_of_range`',
      'An iterator equal to `v.begin() - 1`',
    ],
    correctIndex: 1,
    explanation:
      'No element is `>= 9`, so it returns `last`, which here is `v.end()`. Dereferencing it is undefined behavior. The STL algorithms never throw for "not found" and never return a "closest" element: the answer is always a position in `[first, last]`.',
    deepDive: {
      conceptTitle: 'The "last means not found" convention',
      details:
        '`find`, `find_if`, `lower_bound`, `search`, `max_element` (on an empty range) and others all report failure by returning `last`. Always compare against `end()` before dereferencing: `auto it = std::lower_bound(...); if (it != v.end() && *it == target) { ... }`. Turn an iterator into an index with `it - v.begin()` or `std::distance(v.begin(), it)`.',
      interviewTip: 'Binary search for "insert position" returns `v.size()` when the target is larger than everything. That edge case shows up constantly in interview problems.',
    },
  },
  {
    id: 'al-04',
    category: 'Algorithms & Iterators',
    difficulty: 'Gotcha',
    prompt: 'What does this print?',
    code: code`
      std::vector<int> v{1, 3, 2, 3, 4};
      std::remove(v.begin(), v.end(), 3);
      std::cout << v.size();
    `,
    options: ['`3`', '`5`', '`4`', 'Compile error'],
    correctIndex: 1,
    explanation:
      '`std::remove` can\'t change a container\'s size, because it only sees iterators. It shifts the kept elements forward (`1 2 4 …`) and returns an iterator to the new logical end. The vector still has 5 elements, and the tail holds valid but unspecified values.',
    deepDive: {
      conceptTitle: 'Algorithms vs containers',
      details:
        'Algorithms in `<algorithm>` work on iterator ranges and can\'t insert or erase from a container. `remove`, `remove_if` and `unique` reorder the range and return the new end. The container must then `erase` the tail. Since C++20, `remove` is marked `[[nodiscard]]`, so ignoring its result also triggers a compiler warning.',
      interviewTip: 'If someone writes `std::remove` without a matching `erase`, point it out right away. Reviewers check for exactly this.',
    },
  },
  {
    id: 'al-05',
    category: 'Algorithms & Iterators',
    difficulty: 'Quick Syntax',
    prompt: 'Which line removes every `3` from `std::vector<int> v` (pre-C++20 style)?',
    options: [
      '`v.erase(std::remove(v.begin(), v.end(), 3), v.end());`',
      '`v.erase(std::remove(v.begin(), v.end(), 3));`',
      '`std::remove(v, 3);`',
      '`v.remove(3);`',
    ],
    correctIndex: 0,
    explanation:
      'This is the erase-remove idiom: `remove` returns the new logical end, and `erase(newEnd, end())` drops the tail. Forgetting `v.end()` calls the single-element `erase`, which removes only one element, or is undefined behavior if `remove` returned `end()`. `std::remove(v, 3)` isn\'t a valid overload (the ranges version is `std::ranges::remove`, and it still doesn\'t erase). `std::vector` has no `remove` member, only `std::list` does.',
    deepDive: {
      conceptTitle: 'Erase–remove idiom',
      details:
        'With a predicate: `v.erase(std::remove_if(v.begin(), v.end(), pred), v.end());`. It\'s O(n) with a single pass, and it\'s stable (kept elements keep their relative order). It\'s much better than calling `erase` in a loop, which is O(n²) because every erase shifts the tail. `std::list` instead provides member `remove`/`remove_if` that relink nodes.',
      interviewTip: 'In C++20 just write `std::erase(v, 3);`. It does the same thing and returns the count removed.',
    },
  },
  {
    id: 'al-06',
    category: 'Algorithms & Iterators',
    difficulty: 'Quick Syntax',
    prompt: 'In C++20, how do you remove all even numbers from `std::vector<int> v` in one call?',
    options: [
      '`v.erase_if([](int x) { return x % 2 == 0; });`',
      '`std::erase_if(v, [](int x) { return x % 2 == 0; });`',
      '`std::erase_if(v.begin(), v.end(), [](int x) { return x % 2 == 0; });`',
      '`std::remove_if(v, [](int x) { return x % 2 == 0; });`',
    ],
    correctIndex: 1,
    explanation:
      'C++20 added the free functions `std::erase(c, value)` and `std::erase_if(c, pred)`. They take the container itself, so they can actually shrink it, and they return the number of elements removed. They aren\'t member functions and don\'t take iterator pairs. `std::remove_if` takes iterators and doesn\'t erase.',
    deepDive: {
      conceptTitle: 'Uniform container erasure (C++20)',
      details:
        'C++20 overloads `std::erase` and `std::erase_if` for all standard sequence containers and `std::basic_string`, and `std::erase_if` for associative and unordered containers too. For vector, deque and string they apply erase-remove. For list and forward_list they call the member `remove_if`. For maps and sets they loop with `it = c.erase(it)`. Each is declared in its container\'s header, such as `<vector>` or `<map>`.',
      interviewTip: 'Ask whether C++20 is allowed. If it is, `std::erase_if` is shorter and impossible to get wrong.',
    },
  },
  {
    id: 'al-07',
    category: 'Algorithms & Iterators',
    difficulty: 'Gotcha',
    prompt: 'What is the problem with this code?',
    code: code`
      std::vector<long long> v{3'000'000'000LL, 3'000'000'000LL};
      auto sum = std::accumulate(v.begin(), v.end(), 0);
    `,
    options: [
      'None: `sum` is `6000000000`',
      '`sum` is an `int` (deduced from `0`), so each partial sum is narrowed back to `int` and the result is wrong',
      'Compile error: type mismatch between `0` and `long long`',
      '`std::accumulate` throws `std::overflow_error`',
    ],
    correctIndex: 1,
    explanation:
      '`accumulate`\'s return and accumulator type is the type of `init`, here `int`. Each step computes `int + long long`, which is a `long long`, and then assigns it back into an `int`, truncating it. Pass `0LL` (or `int64_t{0}`) so the accumulator is wide enough.',
    deepDive: {
      conceptTitle: 'std::accumulate init type',
      details:
        '`template<class InputIt, class T> T accumulate(InputIt first, InputIt last, T init)` computes `init = std::move(init) + *it` for each element. The same trap with doubles: `std::accumulate(d.begin(), d.end(), 0)` truncates every partial sum to an `int`, so use `0.0`. `std::reduce` (C++17, `<numeric>`) has the same `init` rule, may reorder operations, and can run in parallel.',
      interviewTip: 'Write `std::accumulate(v.begin(), v.end(), 0LL)` by reflex whenever sums might exceed about 2·10⁹.',
    },
  },
  {
    id: 'al-08',
    category: 'Algorithms & Iterators',
    difficulty: 'Concept',
    prompt: 'After `std::nth_element(v.begin(), v.begin() + k, v.end());`, what is guaranteed?',
    options: [
      'The whole vector is sorted',
      '`v[k]` is the element that would be there if sorted; everything before is `<=` it and everything after is `>=` it',
      'The first k elements are sorted',
      'Only that `v[k]` is the k-th smallest; other elements are unchanged',
    ],
    correctIndex: 1,
    explanation:
      '`nth_element` is a partial-sort selection (introselect). It places the correct element at position k and partitions the rest around it. Neither side is sorted, and other elements can move. It runs in O(n) on average.',
    deepDive: {
      conceptTitle: 'Selection algorithms',
      details:
        '`nth_element` gives the k-th order statistic or median in average O(n), with the partition as a bonus. `partial_sort(first, middle, last)` sorts just the smallest `middle - first` elements in O(n log k). `std::sort` is O(n log n). For the median of an even-length array, run `nth_element` for n/2 and then take `*std::max_element(v.begin(), v.begin() + n/2)` to get the other middle element.',
      interviewTip: 'For "k-th largest element", `nth_element` with `std::greater<>()` is the one-liner. Also be ready to explain the heap and quickselect approaches.',
    },
  },
  {
    id: 'al-09',
    category: 'Algorithms & Iterators',
    difficulty: 'Gotcha',
    prompt: 'What does `v` contain after this code?',
    code: code`
      std::vector<int> v{1, 1, 2, 2, 1, 3};
      v.erase(std::unique(v.begin(), v.end()), v.end());
    `,
    options: ['`{1, 2, 3}`', '`{1, 2, 1, 3}`', '`{1, 2, 2, 1, 3}`', '`{3, 2, 1}`'],
    correctIndex: 1,
    explanation:
      '`std::unique` removes only consecutive duplicates, collapsing each run of equal elements to one. The runs here are `1 1 | 2 2 | 1 | 3`, giving `{1, 2, 1, 3}`. To deduplicate the whole vector, sort it first.',
    deepDive: {
      conceptTitle: 'Dedup idiom',
      details:
        'The full dedup is `std::sort(v.begin(), v.end()); v.erase(std::unique(v.begin(), v.end()), v.end());`, which is O(n log n). Like `remove`, `unique` doesn\'t change the size and returns the new logical end. It takes an optional binary predicate, e.g. to merge case-insensitive duplicates. If you need to keep the original order, use a `std::unordered_set` to track elements already seen.',
      interviewTip: 'Coordinate compression is sort + unique + erase, then `lower_bound` to map each value to its rank.',
    },
  },
  {
    id: 'al-10',
    category: 'Algorithms & Iterators',
    difficulty: 'Quick Syntax',
    prompt: 'Which call sorts `std::vector<int> v` in descending order?',
    options: [
      '`std::sort(v.begin(), v.end(), std::greater<int>);`',
      '`std::sort(v.begin(), v.end(), std::greater<int>());`',
      '`std::sort(v.end(), v.begin());`',
      '`std::sort(v.begin(), v.end(), std::less<int>());`',
    ],
    correctIndex: 1,
    explanation:
      'The comparator must be an object, so `std::greater<int>()` (or `std::greater<>{}`) is needed. Passing just the type `std::greater<int>` doesn\'t compile. Swapping `begin` and `end` gives an invalid range, which is undefined behavior. `std::less` sorts ascending, same as the default.',
    deepDive: {
      conceptTitle: 'Sorting idioms',
      details:
        'Other ways to sort descending: `std::sort(v.rbegin(), v.rend());` (sort ascending through reverse iterators), or a lambda `[](int a, int b) { return a > b; }`. C++20 ranges version: `std::ranges::sort(v, std::greater{});`. `std::sort` is introsort, O(n log n) worst case since C++11, and not stable.',
      interviewTip: 'To sort by one key and then another, use a lambda returning `std::tie(a.k1, b.k2) < std::tie(b.k1, a.k2)`. Swapping the order within one `tie` flips that key\'s direction.',
    },
  },
  {
    id: 'al-11',
    category: 'Algorithms & Iterators',
    difficulty: 'Concept',
    prompt: 'What does `std::stable_sort` guarantee that `std::sort` does not?',
    options: [
      'O(n) time on already-sorted input',
      'Elements that compare equal keep their original relative order',
      'It sorts in place with O(1) extra memory',
      'It works with forward iterators',
    ],
    correctIndex: 1,
    explanation:
      'Stability means equivalent elements stay in input order. That matters when you sort by one key after another, e.g. by name and then stably by department. Neither algorithm guarantees O(n) on sorted input. `stable_sort` usually allocates a buffer, and both need random-access iterators.',
    deepDive: {
      conceptTitle: 'Stability & complexity',
      details:
        '`std::sort`: introsort (quicksort + heapsort fallback + insertion sort), O(n log n), not stable. `std::stable_sort`: merge sort, O(n log n) with an O(n) buffer, degrading to O(n log² n) if no memory is available. `std::list::sort` is a stable merge sort on nodes. `std::partial_sort` and `std::nth_element` are not stable either.',
      interviewTip: 'If equal elements need a deterministic order, either use `stable_sort` or add a tiebreaker (such as the original index) to the comparator.',
    },
  },
  {
    id: 'al-12',
    category: 'Algorithms & Iterators',
    difficulty: 'Concept',
    prompt: 'You need the INDEX of `x` in a sorted `std::vector<int> v`. Why is `std::binary_search` the wrong tool?',
    options: [
      'It requires the vector to be sorted descending',
      'It returns only a `bool`; use `std::lower_bound` to get the position',
      'It is O(n)',
      'It returns `-1` when not found, which is ambiguous',
    ],
    correctIndex: 1,
    explanation:
      '`std::binary_search` answers only "is it there?". `lower_bound` gives an iterator, so you check `it != v.end() && *it == x` and get the index from `it - v.begin()`. All of these are O(log n) on sorted random-access ranges.',
    deepDive: {
      conceptTitle: 'Binary search family',
      details:
        'The family is `binary_search` (bool), `lower_bound` (first `>= x`), `upper_bound` (first `> x`), and `equal_range` (both). Each has a comparator overload that must match the order the range was sorted with. For a predicate, `std::partition_point(first, last, pred)` returns the first element where `pred` becomes false. That\'s the general "binary search on the answer" primitive.',
      interviewTip: 'When writing binary search by hand in an interview, state the invariant (e.g. "`lo` is always valid, `hi` is always invalid") before coding.',
    },
  },
  {
    id: 'al-13',
    category: 'Algorithms & Iterators',
    difficulty: 'Quick Syntax',
    prompt: 'Given `std::list<int>::iterator it`, how do you get a NEW iterator 3 positions ahead?',
    options: ['`auto j = it + 3;`', '`auto j = std::next(it, 3);`', '`auto j = std::advance(it, 3);`', '`auto j = it[3];`'],
    correctIndex: 1,
    explanation:
      '`std::next(it, n)` returns a copy advanced by n and works for any iterator category. List iterators are bidirectional, so `it + 3` and `it[3]` don\'t compile. `std::advance` modifies `it` in place and returns `void`.',
    deepDive: {
      conceptTitle: 'Iterator categories & helpers',
      details:
        'The categories run input → forward → bidirectional → random access → contiguous (C++20). `std::advance(it, n)` and `std::distance(a, b)` are O(1) for random-access iterators and O(n) otherwise. `std::prev(it, n)` requires bidirectional iterators. Examples: `vector`/`deque`/`array` iterators are random-access; `list`/`set`/`map` are bidirectional; `forward_list`/`unordered_*` are forward.',
      interviewTip: 'Calling `std::distance` on list iterators inside a loop silently turns the loop O(n²). Mention that if they ask about complexity.',
    },
  },
  {
    id: 'al-14',
    category: 'Algorithms & Iterators',
    difficulty: 'Quick Syntax',
    prompt: 'Which line stores the maximum value of a non-empty `std::vector<int> v` in `m`?',
    options: [
      '`int m = std::max_element(v.begin(), v.end());`',
      '`int m = *std::max_element(v.begin(), v.end());`',
      '`int m = std::max(v);`',
      '`int m = v.max();`',
    ],
    correctIndex: 1,
    explanation:
      '`max_element` returns an iterator, which you must dereference. `std::max` takes two values or an `initializer_list`, not a vector. `vector` has no `max()` member. In C++20, `std::ranges::max(v)` returns the value directly.',
    deepDive: {
      conceptTitle: 'min/max helpers',
      details:
        '`std::max_element` and `std::min_element` return an iterator to the first max/min, or `last` if the range is empty. `std::minmax_element` finds both in about 1.5n comparisons. `std::max({a, b, c})` takes an initializer list. `std::clamp(x, lo, hi)` (C++17) bounds a value. Get the index with `std::max_element(...) - v.begin()`.',
      interviewTip: 'Dereferencing `max_element` on an empty vector is undefined behavior. Guard with `if (!v.empty())`.',
    },
  },
  {
    id: 'al-15',
    category: 'Algorithms & Iterators',
    difficulty: 'Gotcha',
    prompt: 'What is wrong here?',
    code: code`
      std::vector<int> in{1, 2, 3};
      std::vector<int> out;
      std::transform(in.begin(), in.end(), out.begin(),
                     [](int x) { return x * x; });
    `,
    options: [
      'Nothing: `out` becomes `{1, 4, 9}`',
      'Undefined behavior: `out` is empty, so writing through `out.begin()` goes out of bounds',
      'Compile error: `transform` needs a function pointer',
      '`out` ends up as `{0, 0, 0}`',
    ],
    correctIndex: 1,
    explanation:
      'Output iterators write to existing slots. They don\'t grow the container. Use `std::back_inserter(out)`, which calls `push_back`, or size the vector first with `out.resize(in.size())`.',
    deepDive: {
      conceptTitle: 'Output iterators & inserters',
      details:
        '`std::back_inserter(c)` calls `c.push_back` on each assignment, `std::front_inserter(c)` calls `push_front`, and `std::inserter(c, pos)` calls `insert`. Any algorithm that writes into an output range (`copy`, `transform`, `merge`, `set_intersection`, …) assumes the destination has enough room. Pair `back_inserter` with `out.reserve(in.size())` to avoid reallocations.',
      interviewTip: 'For `std::set_intersection` and friends, `std::back_inserter(result)` is the idiomatic destination.',
    },
  },
];

// ============================================================================
// 4. Memory, Pointers & Modern C++
// ============================================================================
const MEMORY: Question[] = [
  {
    id: 'mm-01',
    category: 'Memory & Modern C++',
    difficulty: 'Quick Syntax',
    prompt: 'Given `auto a = std::make_unique<int>(5);`, which statement compiles and transfers ownership to `b`?',
    options: ['`auto b = a;`', '`auto b = std::move(a);`', '`auto b = a.get();`', '`auto b = &a;`'],
    correctIndex: 1,
    explanation:
      '`unique_ptr` is move-only, so its copy constructor is deleted and `auto b = a;` doesn\'t compile. `std::move(a)` lets the move constructor run: `b` takes ownership and `a` becomes `nullptr`. `a.get()` gives a non-owning raw pointer, and `&a` is a pointer to the `unique_ptr` itself.',
    deepDive: {
      conceptTitle: 'unique_ptr ownership transfer',
      details:
        'Exactly one `unique_ptr` owns the object, and it deletes the object when it is destroyed. Ownership moves with `std::move`, when returning from a function (implicit move), or when passing by value into a "sink" parameter: `void take(std::unique_ptr<T> p); take(std::move(a));`. `release()` gives up ownership without deleting, and `reset(p)` deletes the current object and adopts `p`.',
      interviewTip: 'Returning `std::unique_ptr<T>` from a factory needs no `std::move`: `return p;` moves automatically.',
    },
  },
  {
    id: 'mm-02',
    category: 'Memory & Modern C++',
    difficulty: 'Concept',
    prompt: 'A function only needs to READ a `Widget` that might be owned by a `unique_ptr` elsewhere. What is the best parameter type?',
    options: [
      '`std::unique_ptr<Widget>` (by value)',
      '`const Widget&` (or `const Widget*` if it can be null)',
      '`std::shared_ptr<Widget>` (by value)',
      '`std::unique_ptr<Widget>&&`',
    ],
    correctIndex: 1,
    explanation:
      'Functions that don\'t take part in ownership should take plain references or pointers, which keeps them usable with any ownership scheme. A by-value `unique_ptr` steals ownership. A `shared_ptr` forces callers into shared ownership and adds atomic refcount traffic. `unique_ptr&&` signals "might take ownership", which is misleading here.',
    deepDive: {
      conceptTitle: 'Smart pointer parameter guidelines',
      details:
        'Per the C++ Core Guidelines: take `T&` or `const T&` to use an object, `T*` when it may be absent, `std::unique_ptr<T>` by value to take ownership ("sink"), `std::unique_ptr<T>&` to reseat the caller\'s pointer, `std::shared_ptr<T>` by value to share ownership, and `const std::shared_ptr<T>&` only when you might or might not keep a copy. Call with `f(*ptr)` or `f(ptr.get())`.',
      interviewTip: 'Say "ownership is part of the signature". That phrase shows you think about API design.',
    },
  },
  {
    id: 'mm-03',
    category: 'Memory & Modern C++',
    difficulty: 'Concept',
    prompt: 'What happens when `a` and `b` go out of scope?',
    code: code`
      struct Node { std::shared_ptr<Node> next; ~Node() { std::cout << "bye "; } };
      {
          auto a = std::make_shared<Node>();
          auto b = std::make_shared<Node>();
          a->next = b;
          b->next = a;
      }
    `,
    options: [
      'Prints `bye bye`',
      'Nothing is printed: the reference cycle keeps both use counts at 1, so the nodes leak',
      'Double free crash',
      'Prints `bye` once',
    ],
    correctIndex: 1,
    explanation:
      'When the locals die, each node is still owned by the other, so both counts drop from 2 to 1, never to 0, and neither destructor runs. Make one direction a `std::weak_ptr<Node>` (e.g. the back or parent pointer) to break the cycle.',
    deepDive: {
      conceptTitle: 'shared_ptr cycles & weak_ptr',
      details:
        '`shared_ptr` uses reference counting, which can\'t reclaim cycles. A `weak_ptr` observes an object without owning it: it doesn\'t increase the strong count, and it can tell whether the object still exists. Typical owners: a parent owns its children with `shared_ptr` or `unique_ptr`, and children point back to the parent with `weak_ptr` or a raw pointer. Observers and caches also hold `weak_ptr`.',
      interviewTip: 'For trees, `unique_ptr` children plus a raw parent pointer is simpler and faster than `shared_ptr` everywhere.',
    },
  },
  {
    id: 'mm-04',
    category: 'Memory & Modern C++',
    difficulty: 'Quick Syntax',
    prompt: 'Given `std::weak_ptr<Widget> wp;`, what is the correct way to safely use the `Widget` if it still exists?',
    options: [
      '`wp->draw();`',
      '`if (auto sp = wp.lock()) sp->draw();`',
      '`if (wp) wp.get()->draw();`',
      '`(*wp).draw();`',
    ],
    correctIndex: 1,
    explanation:
      '`weak_ptr` has no `->`, `*`, `get()` or `operator bool`. `lock()` atomically returns a `shared_ptr` that keeps the object alive while you use it, or an empty `shared_ptr` if the object is gone.',
    deepDive: {
      conceptTitle: 'weak_ptr API',
      details:
        'The core members are `lock()` (returns a `shared_ptr`, possibly empty), `expired()` (true when the use count is 0), `use_count()`, and `reset()`. Avoid `if (!wp.expired()) wp.lock()->...`, because the object can die between the check and the lock. Use the single `lock()` call. Constructing a `shared_ptr` directly from an expired `weak_ptr` (`std::shared_ptr<T> sp(wp);`) throws `std::bad_weak_ptr`.',
      interviewTip: 'Use `if (auto sp = wp.lock())` every time. It checks and keeps the object alive in one step.',
    },
  },
  {
    id: 'mm-05',
    category: 'Memory & Modern C++',
    difficulty: 'Concept',
    prompt:
      'Before C++17, why was `f(std::make_unique<A>(), g())` considered safer than `f(std::unique_ptr<A>(new A), g())`?',
    options: [
      '`make_unique` allocates A on the stack',
      'The compiler could run `new A`, then `g()`, then construct the `unique_ptr`; if `g()` threw, A leaked',
      '`make_unique` uses a single allocation for the object and control block',
      '`new` was deprecated in C++14',
    ],
    correctIndex: 1,
    explanation:
      'Before C++17, function arguments could be evaluated interleaved, so the raw `new A` could be left unowned while `g()` ran. `make_unique` does the allocation and the ownership in one call. C++17 forbids interleaving argument evaluation, which closes this specific leak, but `make_unique` is still preferred.',
    deepDive: {
      conceptTitle: 'make_unique / make_shared',
      details:
        'Reasons to prefer the factories: no naked `new`, no repeating the type (`auto p = std::make_unique<Widget>(args);`), and exception safety in complex expressions. `make_shared` also does a single allocation for the object and the control block. Times to use `new` directly: custom deleters, private constructors (a factory inside the class), or with `make_shared` when long-lived `weak_ptr`s would keep the combined block alive.',
      interviewTip: 'C++20 adds `std::make_unique_for_overwrite` and `std::make_shared_for_overwrite` to skip zero-initialization of large buffers.',
    },
  },
  {
    id: 'mm-06',
    category: 'Memory & Modern C++',
    difficulty: 'Concept',
    prompt: 'What is a key performance difference between `std::make_shared<T>()` and `std::shared_ptr<T>(new T)`?',
    options: [
      '`make_shared` skips reference counting',
      '`make_shared` allocates the object and the control block in ONE allocation; the other form needs two',
      '`shared_ptr(new T)` is thread-safe; `make_shared` isn\'t',
      'There is no difference',
    ],
    correctIndex: 1,
    explanation:
      '`make_shared` puts the `T` and the reference-count control block in a single allocation, which means fewer allocations and better locality. The trade-off: the memory is freed only after the last `weak_ptr` is gone too, even though `T`\'s destructor runs when the strong count reaches 0. Both forms use the same atomic reference counting.',
    deepDive: {
      conceptTitle: 'shared_ptr control block',
      details:
        'The control block holds the strong count, the weak count, the deleter and the allocator. Copying a `shared_ptr` atomically increments the strong count, so pass it by `const&` or move it when you don\'t need a new owner. The `shared_ptr` object itself is two pointers wide (object pointer and control-block pointer). The refcount is thread-safe. Concurrent access to the pointed-to object isn\'t.',
      interviewTip: 'Calling `shared_ptr<T>(rawPtr)` twice on the same raw pointer creates two control blocks, so the object gets deleted twice. Use `enable_shared_from_this` when an object needs a `shared_ptr` to itself.',
    },
  },
  {
    id: 'mm-07',
    category: 'Memory & Modern C++',
    difficulty: 'Gotcha',
    prompt: 'What is the behavior of this code?',
    code: code`
      std::string_view sv = std::string("hello") + " world";
      std::cout << sv;
    `,
    options: [
      'Prints `hello world`',
      'Undefined behavior: `sv` views a temporary string destroyed at the end of the full-expression',
      'Compile error: `string_view` can\'t be built from `std::string`',
      'Prints `hello`',
    ],
    correctIndex: 1,
    explanation:
      '`operator+` produces a temporary `std::string`. `sv` points into its buffer, and the temporary is destroyed at the `;`. Reading `sv` afterwards is a dangling read, which is undefined behavior. It may even appear to work in testing.',
    deepDive: {
      conceptTitle: 'string_view lifetime',
      details:
        '`std::string_view` is a non-owning (pointer, length) pair. Lifetime extension applies only when a temporary binds directly to a `const&` or `&&` reference, not to a view object. Safe uses: function parameters (`void f(std::string_view s)`) and views of string literals or long-lived strings. Dangerous uses: storing a view as a member, returning a view of a local, or assigning a view from a temporary.',
      interviewTip: 'Use `string_view` for read-only parameters and `std::string` for anything you store or return.',
    },
  },
  {
    id: 'mm-08',
    category: 'Memory & Modern C++',
    difficulty: 'Gotcha',
    prompt: 'What does this print?',
    code: code`
      std::string_view sv = "hello world";
      sv = sv.substr(0, 5);
      std::printf("%s\n", sv.data());
    `,
    options: ['`hello`', '`hello world`', 'Compile error', 'An empty line'],
    correctIndex: 1,
    explanation:
      '`string_view::substr` only shrinks the view\'s length, and `data()` still points into the original literal. `%s` reads until a NUL, and the next NUL comes after `world`. A view is not guaranteed to be null-terminated, so passing `.data()` to C APIs is a bug.',
    deepDive: {
      conceptTitle: 'string_view is not a C string',
      details:
        'Only `std::string::c_str()` (and, since C++11, `std::string::data()`) guarantee null termination. To print a view, use `std::cout << sv` or `printf("%.*s", (int)sv.size(), sv.data())`. To pass a view to a C API, convert with `std::string(sv).c_str()`. `remove_prefix` and `remove_suffix` are O(1) and also just adjust the window.',
      interviewTip: 'If an API takes `const char*`, `string_view` is the wrong parameter type for it.',
    },
  },
  {
    id: 'mm-09',
    category: 'Memory & Modern C++',
    difficulty: 'Concept',
    prompt: '`std::optional<int> opt;` is empty. What do `opt.value()`, `*opt`, and `opt.value_or(0)` do, in that order?',
    options: [
      'Return 0, return 0, return 0',
      'Throw `std::bad_optional_access`; undefined behavior; return 0',
      'Undefined behavior; throw `std::bad_optional_access`; return 0',
      'All three throw `std::bad_optional_access`',
    ],
    correctIndex: 1,
    explanation:
      '`value()` is the checked accessor and throws `std::bad_optional_access` when empty. `operator*` and `operator->` are unchecked, so using them on an empty optional is undefined behavior. `value_or(def)` returns the contained value or the default you passed.',
    deepDive: {
      conceptTitle: 'std::optional (C++17)',
      details:
        'Use `std::optional<T>` to return "maybe a value" without sentinels like `-1` or out-parameters. Test it with `if (opt)` or `opt.has_value()`. Create values with `return value;`, `return std::nullopt;`, or `std::make_optional`. An optional stores `T` inline, with no heap allocation. C++23 adds monadic helpers: `and_then`, `transform`, `or_else`.',
      interviewTip: 'For a lookup function, `std::optional<int> find(...)` + `if (auto r = find(...))` reads cleaner than returning `-1`.',
    },
  },
  {
    id: 'mm-10',
    category: 'Memory & Modern C++',
    difficulty: 'Gotcha',
    prompt: 'What is the behavior of this code?',
    code: code`
      struct Base { ~Base() { std::cout << "B"; } };
      struct Derived : Base {
          std::vector<int> data{1, 2, 3};
          ~Derived() { std::cout << "D"; }
      };
      Base* p = new Derived;
      delete p;
    `,
    options: [
      'Prints `DB`',
      'Prints `B`, which is well-defined',
      'Undefined behavior: deleting a `Derived` through a `Base*` without a virtual destructor (typically only `~Base` runs and `data` leaks)',
      'Compile error',
    ],
    correctIndex: 2,
    explanation:
      'With a non-virtual destructor, `delete p` uses the static type `Base`, and deleting a derived object that way is undefined behavior. In practice `~Derived` is skipped, so `data` leaks. Declare `virtual ~Base() = default;` and the output becomes `DB`.',
    deepDive: {
      conceptTitle: 'Virtual destructors',
      details:
        'Rule: if a class is meant to be deleted polymorphically (it has virtual functions and you own objects through base pointers), give it a public virtual destructor. Otherwise give it a protected non-virtual one. Destruction order is derived destructor body, then derived members, then base destructor. `std::unique_ptr<Base>` has the same requirement. `std::shared_ptr<Base>` created via `make_shared<Derived>` captures the right deleter, so it works by accident, but don\'t rely on that.',
      interviewTip: 'Any class with a virtual function should get `virtual ~Base() = default;` by reflex.',
    },
  },
  {
    id: 'mm-11',
    category: 'Memory & Modern C++',
    difficulty: 'Concept',
    prompt: 'What does this print?',
    code: code`
      void f(int&)  { std::cout << "L"; }
      void f(int&&) { std::cout << "R"; }

      int a = 1;
      f(a); f(2); f(std::move(a));
    `,
    options: ['`LLR`', '`LRR`', '`LRL`', '`RRR`'],
    correctIndex: 1,
    explanation:
      '`a` is an lvalue, so it calls `f(int&)`. The literal `2` is a prvalue, so it binds to `int&&`. `std::move(a)` is an xvalue (an rvalue), so it also picks `int&&`.',
    deepDive: {
      conceptTitle: 'Value categories',
      details:
        'An lvalue has identity and can\'t be moved from implicitly (named variables, `*p`, `v[i]`). A prvalue is a pure temporary (literals, `x + 1`, functions returning by value). An xvalue is an expiring object (`std::move(x)`, a function returning `T&&`). Overload rules: `T&` binds only to lvalues, `T&&` only to rvalues, and `const T&` binds to everything, which is why copy constructors accept temporaries.',
      interviewTip: '`std::move` doesn\'t move anything. It\'s just `static_cast<T&&>`, which enables move overloads.',
    },
  },
  {
    id: 'mm-12',
    category: 'Memory & Modern C++',
    difficulty: 'Gotcha',
    prompt: 'What does `f("hi")` print?',
    code: code`
      void g(std::string&)  { std::cout << "L"; }
      void g(std::string&&) { std::cout << "R"; }
      void f(std::string&& s) { g(s); }
    `,
    options: ['`R`', '`L`', 'Compile error: `s` can\'t bind to `std::string&`', 'Ambiguous call'],
    correctIndex: 1,
    explanation:
      'Inside `f`, `s` has the type `std::string&&`, but a named variable is always an lvalue, so `g(std::string&)` is chosen. To pass the rvalue-ness on, write `g(std::move(s))`. In a template with a forwarding reference, use `std::forward<T>(s)`.',
    deepDive: {
      conceptTitle: 'Named rvalue references are lvalues',
      details:
        'A variable\'s type and its expression\'s value category are separate things. The rule exists for safety: you might use `s` more than once in the body, so the compiler won\'t move from it implicitly. Forwarding references (`template<class T> void f(T&& x)`) combined with `std::forward<T>(x)` preserve whether the caller passed an lvalue or an rvalue.',
      interviewTip: 'In a move constructor, write `Widget(Widget&& o) : name(std::move(o.name)) {}`. Without the `std::move`, the member is copied.',
    },
  },
  {
    id: 'mm-13',
    category: 'Memory & Modern C++',
    difficulty: 'Gotcha',
    prompt: 'What does `s` contain after this code?',
    code: code`
      const std::string s = "abc";
      std::string t = std::move(s);
    `,
    options: [
      'An empty string: it was moved from',
      '`"abc"`: `std::move` on a `const` object yields `const std::string&&`, which binds to the copy constructor',
      'Unspecified',
      'Compile error: can\'t move a `const` object',
    ],
    correctIndex: 1,
    explanation:
      'The move constructor takes `std::string&&` (non-const), so it can\'t accept `const std::string&&`. Overload resolution falls back to the copy constructor `const std::string&`, which silently copies. `s` is untouched.',
    deepDive: {
      conceptTitle: 'const defeats move',
      details:
        'Moving modifies the source, so `const` objects can\'t be moved from. This often hides in `return` statements and in members: a `const std::vector<int> data;` member makes the class\'s move constructor copy `data`. Returning a `const` local also blocks the implicit move on return. Use `const` for things you won\'t move, and leave locals non-const when you plan to `std::move` them.',
      interviewTip: 'If a "move" seems slow, check for a `const` on the source object first.',
    },
  },
  {
    id: 'mm-14',
    category: 'Memory & Modern C++',
    difficulty: 'Concept',
    prompt: 'What goes wrong here?',
    code: code`
      struct Buf {
          int* p = new int[10];
          ~Buf() { delete[] p; }
      };
      Buf a;
      Buf b = a;
    `,
    options: [
      'Nothing',
      'Double `delete[]`: the implicit copy constructor copies the pointer, so both destructors free the same array',
      'Compile error: `Buf` is not copyable',
      'Memory leak only',
    ],
    correctIndex: 1,
    explanation:
      'The compiler-generated copy constructor copies `p` member-by-member (a shallow copy). `a` and `b` then own the same array, and both destructors call `delete[]` on it, which is undefined behavior. A class that manages a resource needs custom copy and move operations or deleted ones (Rule of Three/Five). Better still, hold a `std::vector<int>` or `std::unique_ptr<int[]>` (Rule of Zero).',
    deepDive: {
      conceptTitle: 'Rule of Zero / Three / Five',
      details:
        'Rule of Three: if you need a custom destructor, copy constructor or copy assignment, you probably need all three. Rule of Five adds the move constructor and move assignment. Declaring a destructor suppresses the implicit move operations, so moves silently become copies. Rule of Zero: build classes from members that already manage themselves (`std::vector`, `std::string`, `std::unique_ptr`) and declare none of the five.',
      interviewTip: 'When asked to "implement a string class", mention the copy-and-swap idiom for exception-safe assignment.',
    },
  },
  {
    id: 'mm-15',
    category: 'Memory & Modern C++',
    difficulty: 'Gotcha',
    prompt: 'What is wrong with `std::unique_ptr<int> p(new int[10]);`?',
    options: [
      'Nothing',
      'Undefined behavior: the default deleter calls `delete`, not `delete[]`; use `std::unique_ptr<int[]>` or `std::make_unique<int[]>(10)`',
      'Compile error: `unique_ptr` can\'t hold arrays',
      'It leaks 9 of the 10 ints but is otherwise fine',
    ],
    correctIndex: 1,
    explanation:
      '`std::unique_ptr<T>` uses `std::default_delete<T>`, which calls `delete p`. Memory from `new[]` must be released with `delete[]`, and mismatching them is undefined behavior. The array specialization `std::unique_ptr<int[]>` calls `delete[]` and provides `operator[]`.',
    deepDive: {
      conceptTitle: 'Array ownership',
      details:
        '`std::make_unique<int[]>(n)` value-initializes n ints (zeros) and returns `unique_ptr<int[]>`. `std::shared_ptr<int[]>` is supported since C++17, and `make_shared<int[]>(n)` since C++20. In practice `std::vector<int>` or `std::array<int, N>` is almost always better: it knows its size, can be copied, and offers bounds-checked `at()`.',
      interviewTip: 'If you write `new[]` in an interview, expect a follow-up. Reach for `std::vector` unless you can justify the raw array.',
    },
  },
];

/**
 * Deterministically permutes a question's options (seeded by its id) and remaps `correctIndex`.
 * Authors can write the correct answer in any slot; players see an even spread of A–D that is
 * stable across popup reopens (the persisted `selectedIndex` refers to the displayed order).
 */
function shuffleOptions(q: Question): Question {
  let h = 2166136261;
  for (const ch of q.id) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const rand = () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
  const order = [0, 1, 2, 3];
  for (let i = 3; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return {
    ...q,
    options: order.map((i) => q.options[i]) as Question['options'],
    correctIndex: order.indexOf(q.correctIndex) as Question['correctIndex'],
  };
}

/**
 * Full seed bank: 60 core questions (15 per category) plus the pattern-driven syntax drills
 * (muscle-memory calls for sliding window, two heaps, BFS/DFS, K-way merge, subsets, etc.).
 */
export const SEED_QUESTIONS: Question[] = [
  ...SYNTAX,
  ...SYNTAX_DRILLS,
  ...CONTAINERS,
  ...CONTAINER_DRILLS,
  ...ALGORITHMS,
  ...ALGORITHM_DRILLS,
  ...MEMORY,
  ...MEMORY_DRILLS,
].map(shuffleOptions);
