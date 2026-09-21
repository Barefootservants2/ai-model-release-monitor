# LinkedIn launch: manual and API setup

The intended personal profile is [William Earl Lemon / Ashes2Echoes](https://www.linkedin.com/in/ashes2echoes). This guide prepares two publishing paths; it does not mean a post has been sent.

## Manual path

1. Sign into your own LinkedIn account and confirm the author is your personal profile.
2. Open [the complete draft](../media/LINKEDIN.md) and copy only its Post section.
3. Attach `media/linkedin-launch.png`. Copy the supplied alt text into the image accessibility field.
4. Check the preview and the public app address, `https://ai-release-notes.pplx.app`.
5. Select the intended audience, then publish only when you approve the final text and image.
6. Save the resulting post URL. If you publish manually, tell the assistant before authorizing an API send so the same launch is not posted twice.

Instagram remains deferred. Its supplied assets are drafts, not an instruction to publish.

## API path

LinkedIn's official instructions require a developer application with the **Share on LinkedIn** product and member consent for `w_member_social`; adding a profile URL alone does not authorize posting ([Share on LinkedIn](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin)). Configure the application and its approved OAuth redirect in your own developer account, then complete its OAuth flow.

For identity verification, the official OpenID Connect flow uses `openid` and `profile`; it provides a member subject identifier through the ID token or `GET https://api.linkedin.com/v2/userinfo` ([OpenID Connect instructions](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2)). Email permission is not needed for this launch, and the public profile slug must not be guessed into a Person URN.

Keep the OAuth token out of chat, GitHub, the public app, screenshots and project documents. Use the secure credential form scoped to `api.linkedin.com`; any missing product permission or expired token must be resolved through LinkedIn authorization, not bypassed.

Before sending, verify the authenticated member matches the intended author and obtain approval for the complete text, image, alt text and audience. Authorization to connect the account is separate from approval of a post.

The documented sharing flow uses `POST https://api.linkedin.com/v2/ugcPosts` with `X-Restli-Protocol-Version: 2.0.0`; image posts first register an upload through `/v2/assets?action=registerUpload` and use the returned asset after upload ([Share on LinkedIn](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin)). Recheck the live API contract before implementation, validate any returned upload host, and never forward an API token to an unapproved host.

A documented successful creation returns HTTP 201 and an `X-RestLi-Id`; save that receipt and verify the published post before reporting success ([Share on LinkedIn](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin)). An ambiguous timeout is not permission to retry blindly: reconcile the result first to avoid duplicate posts.

## What remains separate

The monitor itself does not need LinkedIn credentials or a social integration. Keep any publishing workflow separate from the public application, with least privilege, explicit posting approval and a recorded result.
