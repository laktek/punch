## Follow this flow to fix bugs, implement new features for Punch:

1. Fork [Punch on GitHub](http://github.com/laktek/punch):

2. Clone the forked repository:

    git clone git@github.com:YOUR_USER/punch.git && cd punch

3. Install the development version of the package, along with the dependencies. 

		npm link

4. Verify existing tests pass:

    npm test

5. Read the [Code Style Guide](https://github.com/laktek/punch/wiki/Code-Style-Guide).

6. Create a topic branch:

    git checkout -b feature

7. **Make your changes.** (It helps a lot if you write tests first.)

8. Verify that tests still pass:

    npm spec

9. Run JSHint to make sure you're code didn't introduce any inconsistencies:

		jshint lib/*

10. Push the changes to your fork:

    git push -u YOUR_USER feature

11. Send a [pull request](https://github.com/laktek/punch/pulls) describing your changes. 

12. If possible, check whether the [Punch Guide](https://github.com/laktek/punch/wiki) is still up to date, after merging your changes.
