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
 * Allows customization of Messages on-the-fly.
 *
 * @author     Chris Corbyn
 */
interface Swift_Plugins_Decorator_Replacements
{
    /**
     * Return the array of replacements for $address.
     *
     * This method is invoked once for every single recipient of a message.
     *
     * If no replacements can be found, an empty value (NULL) should be returned
     * and no replacements will then be made on the message.
     *
     * @param string $address
     *
     * @return array
     */
    public function getReplacementsFor($address);
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
 * Allows customization of Messages on-the-fly.
 *
 * @author     Chris Corbyn
 */
interface Swift_Plugins_Decorator_Replacements
{
    /**
     * Return the array of replacements for $address.
     *
     * This method is invoked once for every single recipient of a message.
     *
     * If no replacements can be found, an empty value (NULL) should be returned
     * and no replacements will then be made on the message.
     *
     * @param string $address
     *
     * @return array
     */
    public function getReplacementsFor($address);
}
>>>>>>> f68822687c5f9ee8eceefd2757fdc4d90fb0cee7
