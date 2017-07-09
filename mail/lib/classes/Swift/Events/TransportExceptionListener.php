<<<<<<< HEAD
<?php

/*
 * This file is part of SwiftMailer.
 * (c) 2004-2009 Chris Corbyn
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Listens for Exceptions thrown from within the Transport system.
 *
 * @author     Chris Corbyn
 */
interface Swift_Events_TransportExceptionListener extends Swift_Events_EventListener
{
    /**
     * Invoked as a TransportException is thrown in the Transport system.
     *
     * @param Swift_Events_TransportExceptionEvent $evt
     */
    public function exceptionThrown(Swift_Events_TransportExceptionEvent $evt);
}
=======
<?php

/*
 * This file is part of SwiftMailer.
 * (c) 2004-2009 Chris Corbyn
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Listens for Exceptions thrown from within the Transport system.
 *
 * @author     Chris Corbyn
 */
interface Swift_Events_TransportExceptionListener extends Swift_Events_EventListener
{
    /**
     * Invoked as a TransportException is thrown in the Transport system.
     *
     * @param Swift_Events_TransportExceptionEvent $evt
     */
    public function exceptionThrown(Swift_Events_TransportExceptionEvent $evt);
}
>>>>>>> f68822687c5f9ee8eceefd2757fdc4d90fb0cee7
