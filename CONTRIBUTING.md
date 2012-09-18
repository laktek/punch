## Follow this flow to fix bugs, implement new features for Punch:

1. Fork [Punch on GitHub](http://github.com/laktek/punch):
2. Clone the forked repository:
    `git clone git@github.com:YOUR_USER/punch.git && cd punch`
3. Verify that existing tests pass:
    `jasmine-node spec`
4. Create a topic branch:
    `git checkout -b feature`
5. **Make your changes.** (It helps a lot if you write tests first.)
6. Verify that tests still pass:
    `jasmine-node spec`
7. Run JSHint and make sure you're code didn't bring in any inconsistencies (you can ignore the existing ones):
		`jshint lib/*`
8. **Commit your changes**. (repeat 5-8 till you are done with the feature.)
9. Push to your fork:
    `git push -u YOUR_USER feature`
10. Send a [pull request](https://github.com/laktek/punch/pulls) describing your changes. 
