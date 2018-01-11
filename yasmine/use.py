import event


class Publisher(object):
    
    def __init__(self):
        # Set event object
        self.evt_foo = event.Event()
    
    def foo(self):
        # Call event object with self as a sender
        self.evt_foo(self)


# Event handler may be a function or a instance method etc.
# Every handler must accept two arguments; a sender and an event-specific 
# parameter.
def handle_foo(sender, earg):
    print 'foo!'


if __name__ == '__main__':
    
    pub = Publisher()
    # Add event handler
    pub.evt_foo += handle_foo
    # This will cause Publiser.evt_foo event.
    pub.foo()

