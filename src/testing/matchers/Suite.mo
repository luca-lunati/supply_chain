/// A simple test runner
///
/// The functions in this module let you build up trees of tests, and run them.
///
/// ```motoko
/// import M "mo:matchers/Matchers";
/// import T "mo:matchers/Testable";
/// import Suite "mo:matchers/Suite";
///
/// let suite = Suite.suite("My test suite", [
///     Suite.suite("Nat tests", [
///         Suite.test("10 is 10", 10, M.equals(T.nat(10))),
///         Suite.test("5 is greater than three", 5, M.greaterThan<Nat>(3)),
///     ])
/// ]);
/// Suite.run(suite);
/// ```

import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Matchers "Matchers";
import Nat "mo:base/Nat";
import List "mo:base/List";

module {

    type Failure = {
        names : List.List<Text>;
        error : Matchers.Description;
    };

    func joinWith(xs : List.List<Text>, sep : Text) : Text {
        switch (xs) {
            case null {
                "";
            };
            case (?(h, t)) {
                List.foldLeft<Text, Text>(t, h, func(acc, x) = acc # sep # x);
            };
        };
    };

    func displayFailure(failure : Failure) : Text = "\n" # joinWith(failure.names, "/") # " failed:\n" # failure.error.toText();

    /// A collection of tests to be run together
    public type Suite = {
        #node : { name : Text; children : [Suite] };
        #test : { name : Text; test : () -> ?Matchers.Description };
    };

    func prependPath(name : Text) : Failure -> Failure = func(failure : Failure) : Failure = {
        names = List.push(name, failure.names);
        error = failure.error;
    };

    func runInner(suite : Suite) : [Failure] {
        switch suite {
            case (#node({ name; children })) {
                let childFailures = Array.flatten(Array.map(children, runInner));
                Array.map(childFailures, prependPath(name));
            };
            case (#test({ name; test })) {
                switch (test()) {
                    case null { [] };
                    case (?err) { [{ names = ?(name, null); error = err }] };
                };
            };
        };
    };

    /// Runs a given suite of tests. Will exit with a non-zero exit code in case any of the tests fail.
    public func run(suite : Suite) {
        let failures = runInner(suite);
        if (failures.size() == 0) {
            Debug.print("All tests passed.");
        } else {
            for (failure in failures.vals()) {
                Debug.print(displayFailure(failure));
            };
            Debug.print("\n" # Nat.toText(failures.size()) # " tests failed.");

            // Is there a more graceful way to `exit(1)` here?
            assert (false);
        };
    };

    /// Constructs a test suite from a name and an Array of
    public func suite(suiteName : Text, suiteChildren : [Suite]) : Suite {
        #node({ name = suiteName; children = suiteChildren });
    };

    /// Constructs a single test by matching the given `item` against a `matcher`.
    public func test<A>(testName : Text, item : A, matcher : Matchers.Matcher<A>) : Suite {
        testLazy(testName, func() : A = item, matcher);
    };

    /// Like `test`, but accepts a thunk `mkItem` that creates the value to match against.
    /// Use this to delay the evaluation of the to be matched value until the tests actually run.
    public func testLazy<A>(testName : Text, mkItem : () -> A, matcher : Matchers.Matcher<A>) : Suite {
        #test({
            name = testName;
            test = func() : ?Matchers.Description {
                let item = mkItem();
                if (matcher.matches(item)) {
                    null;
                } else {
                    let description = Matchers.Description();
                    matcher.describeMismatch(item, description);
                    ?(description);
                };
            };
        });
    };
};
