export type AllowedPropertyValues = string | number | boolean | null;

export interface AnalyticsProps {
  /**
   * The API endpoint to send analytics data to.
   * @default 'https://api.dub.co'
   */
  apiHost?: string;

  /**
   * This is a JSON object that configures the domains that Dub will track.
   *
   * - `refer`: The Dub short domain for referral program client-side click tracking (previously `shortDomain`). @see: https://d.to/clicks/refer
   * - `site`: The Dub short domain for tracking site visits. @see: https://d.to/clicks/site
   * - `outbound`: An array of domains for cross-domain tracking. When configured, the existing `dub_id` cookie
   *               will be automatically appended to all outbound links targeting these domains to enable
   *               cross-domain tracking across different applications.
   *
   * @example {
   *   refer: "refer.dub.co",
   *   site: "site.dub.co",
   *   outbound: "dub.sh, git.new"
   * }
   */
  domainsConfig?: {
    refer?: string;
    site?: string;
    outbound?: string | string[];
  };

  /**
   * The custom domain you're using on Dub for your short links (for client-side click tracking).
   * @example 'go.example.com'
   * @deprecated Use domainsConfig.refer instead
   */
  shortDomain?: string;

  /**
   * The Attribution Model to use for the analytics event.
   *
   * @default 'last-click'
   *
   * - `first-click` - The first click model gives all the credit to the first touchpoint in the customer journey.
   * - `last-click` - The last click model gives all the credit to the last touchpoint in the customer journey.
   */
  attributionModel?: 'first-click' | 'last-click';

  /**
   * The cookie options to use for the analytics event.
   */
  cookieOptions?: {
    /**
     * Specifies the value for the {@link https://tools.ietf.org/html/rfc6265#section-5.2.3|Domain Set-Cookie attribute}. By default, no
     * domain is set, and most clients will consider the cookie to apply to only the current domain.
     * By default, the domain is set to the current hostname (including all subdomains).
     *
     * @default `.` + window.location.hostname
     */
    domain?: string | undefined;

    /**
     * Specifies the `Date` object to be the value for the {@link https://tools.ietf.org/html/rfc6265#section-5.2.1|`Expires` `Set-Cookie` attribute}. By default,
     * no expiration is set, and most clients will consider this a "non-persistent cookie" and will delete
     * it on a condition like exiting a web browser application.
     *
     * *Note* the {@link https://tools.ietf.org/html/rfc6265#section-5.3|cookie storage model specification}
     * states that if both `expires` and `maxAge` are set, then `maxAge` takes precedence, but it is
     * possible not all clients by obey this, so if both are set, they should
     * point to the same date and time.
     */
    expires?: Date | undefined;

    /**
     * Specifies the number of days until the cookie expires.
     *
     * @default 90
     */
    expiresInDays?: number | undefined;

    /**
     * Specifies the boolean value for the {@link https://tools.ietf.org/html/rfc6265#section-5.2.6|`HttpOnly` `Set-Cookie` attribute}.
     * When truthy, the `HttpOnly` attribute is set, otherwise it is not. By
     * default, the `HttpOnly` attribute is not set.
     *
     * *Note* be careful when setting this to true, as compliant clients will
     * not allow client-side JavaScript to see the cookie in `document.cookie`.
     */
    httpOnly?: boolean | undefined;

    /**
     * Specifies the number (in seconds) to be the value for the `Max-Age`
     * `Set-Cookie` attribute. The given number will be converted to an integer
     * by rounding down. By default, no maximum age is set.
     *
     * *Note* the {@link https://tools.ietf.org/html/rfc6265#section-5.3|cookie storage model specification}
     * states that if both `expires` and `maxAge` are set, then `maxAge` takes precedence, but it is
     * possible not all clients by obey this, so if both are set, they should
     * point to the same date and time.
     */
    maxAge?: number | undefined;

    /**
     * Specifies the value for the {@link https://tools.ietf.org/html/rfc6265#section-5.2.4|`Path` `Set-Cookie` attribute}.
     * By default, the path is considered the "default path".
     */
    path?: string | undefined;

    /**
     * Specifies the boolean or string to be the value for the {@link https://tools.ietf.org/html/draft-ietf-httpbis-rfc6265bis-03#section-4.1.2.7|`SameSite` `Set-Cookie` attribute}.
     *
     * - `true` will set the `SameSite` attribute to `Strict` for strict same
     * site enforcement.
     * - `false` will not set the `SameSite` attribute.
     * - `'lax'` will set the `SameSite` attribute to Lax for lax same site
     * enforcement.
     * - `'strict'` will set the `SameSite` attribute to Strict for strict same
     * site enforcement.
     *  - `'none'` will set the SameSite attribute to None for an explicit
     *  cross-site cookie.
     *
     * More information about the different enforcement levels can be found in {@link https://tools.ietf.org/html/draft-ietf-httpbis-rfc6265bis-03#section-4.1.2.7|the specification}.
     *
     * *note* This is an attribute that has not yet been fully standardized, and may change in the future. This also means many clients may ignore this attribute until they understand it.
     */
    sameSite?: true | false | 'lax' | 'strict' | 'none' | undefined;

    /**
     * Specifies the boolean value for the {@link https://tools.ietf.org/html/rfc6265#section-5.2.5|`Secure` `Set-Cookie` attribute}. When truthy, the
     * `Secure` attribute is set, otherwise it is not. By default, the `Secure` attribute is not set.
     *
     * *Note* be careful when setting this to `true`, as compliant clients will
     * not send the cookie back to the server in the future if the browser does
     * not have an HTTPS connection.
     */
    secure?: boolean | undefined;
  };

  /**
   * The query parameter to listen to for client-side click-tracking (e.g. `?via=john`, `?ref=jane`).
   *
   * @default 'via'
   */
  queryParam?: string;

  /**
   * Custom properties to pass to the script.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLScriptElement
   */
  scriptProps?: React.DetailedHTMLProps<
    React.ScriptHTMLAttributes<HTMLScriptElement>,
    HTMLScriptElement
  >;
}

export interface ClickApiResponse {
  clickId: string;
}

export interface TrackClickInput {
  domain: string;
  key: string;
}
