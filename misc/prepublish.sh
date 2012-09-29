#!/bin/sh
exitstatus=0
/bin/echo "Running the test suite..."

jasmine-node spec;

if [ $? == 0 ]
then
	/bin/echo "Running JSHint..."
	jshint lib/*;
	exitstatus=$?
else
	exitstatus=$?
fi

if [ $exitstatus != 0 ]
then
		/bin/echo -n "It seems there are failing tests or code style issues. Ignore them and continue with publishing? (y/n): " 
    read answer
    if [ "$answer" == "y" ]
    then
			exit 0
		else 
			/bin/echo "Canceling package publishing..."
			exit 1	
    fi
fi
