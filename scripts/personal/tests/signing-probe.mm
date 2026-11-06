#import "ArdiaPersonalSigning.h"

int main(int argc, const char *argv[]) {
  @autoreleasepool {
    SecKeychainSetUserInteractionAllowed(false);
    printf("build %d\n", ARDIA_SIGNING_TEST_BUILD);
    const OSStatus status = ArdiaPersonalSigningStatus(NSBundle.mainBundle);
    if (status != errSecSuccess) {
      fprintf(stderr, "signing rejected: %d\n", (int)status);
      return 1;
    }
    if (argc != 2) return 64;
    SecKeychainRef keychain = nullptr;
    if (SecKeychainOpen(argv[1], &keychain) != errSecSuccess) return 2;
    NSDictionary *query = @{
      (__bridge id)kSecClass: (__bridge id)kSecClassGenericPassword,
      (__bridge id)kSecAttrService: @"Ardia Personal Signing Test",
      (__bridge id)kSecAttrAccount: @"fixture",
      (__bridge id)kSecMatchSearchList: @[(__bridge id)keychain],
      (__bridge id)kSecReturnData: @YES,
      (__bridge id)kSecUseAuthenticationUI: (__bridge id)kSecUseAuthenticationUIFail
    };
    CFTypeRef result = nullptr;
    OSStatus found = SecItemCopyMatching((__bridge CFDictionaryRef)query, &result);
    if (found == errSecItemNotFound) {
      NSMutableDictionary *attributes = [query mutableCopy];
      [attributes removeObjectForKey:(__bridge id)kSecMatchSearchList];
      [attributes removeObjectForKey:(__bridge id)kSecReturnData];
      attributes[(__bridge id)kSecUseKeychain] = (__bridge id)keychain;
      attributes[(__bridge id)kSecValueData] = [@"disposable-test-value" dataUsingEncoding:NSUTF8StringEncoding];
      found = SecItemAdd((__bridge CFDictionaryRef)attributes, nullptr);
      puts(found == errSecSuccess ? "created" : "create failed");
    } else {
      NSData *expected = [@"disposable-test-value" dataUsingEncoding:NSUTF8StringEncoding];
      if (found == errSecSuccess && ![(__bridge NSData *)result isEqualToData:expected]) found = errSecDecode;
      puts(found == errSecSuccess ? "read" : "read failed");
    }
    if (result) CFRelease(result);
    CFRelease(keychain);
    return found == errSecSuccess ? 0 : 3;
  }
}
