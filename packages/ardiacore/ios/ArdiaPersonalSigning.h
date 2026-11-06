#import <Foundation/Foundation.h>
#import <Security/Security.h>

static inline OSStatus ArdiaPersonalSigningStatus(NSBundle *bundle) {
  if (![[bundle objectForInfoDictionaryKey:@"ACPersonalBuild"] boolValue] ||
      ![bundle.bundleIdentifier isEqualToString:@"dev.simon.ardia.personal"] ||
      ![[bundle objectForInfoDictionaryKey:@"ACPersonalSafeStorage"] isEqual:@"shared-ardia"])
    return errSecParam;
  id fingerprint = [bundle objectForInfoDictionaryKey:@"ACPersonalSigningCertificateSHA1"];
  if (![fingerprint isKindOfClass:NSString.class] || [fingerprint length] != 40 ||
      [fingerprint rangeOfCharacterFromSet:[NSCharacterSet characterSetWithCharactersInString:@"0123456789abcdefABCDEF"].invertedSet].location != NSNotFound)
    return errSecParam;
  NSString *expression = [NSString stringWithFormat:@"identifier \"dev.simon.ardia.personal\" and certificate leaf = H\"%@\"", fingerprint];
  SecRequirementRef requirement = nullptr;
  OSStatus status = SecRequirementCreateWithString((__bridge CFStringRef)expression, kSecCSDefaultFlags, &requirement);
  if (status != errSecSuccess) return status;
  SecCodeRef code = nullptr;
  status = SecCodeCopySelf(kSecCSDefaultFlags, &code);
  if (status == errSecSuccess) {
    status = SecCodeCheckValidity(code, kSecCSDefaultFlags, requirement);
    if (status == errSecSuccess) {
      SecStaticCodeRef diskCode = nullptr;
      status = SecCodeCopyStaticCode(code, kSecCSDefaultFlags, &diskCode);
      if (status == errSecSuccess) {
        status = SecStaticCodeCheckValidity(diskCode, kSecCSStrictValidate, requirement);
        CFRelease(diskCode);
      }
    }
    CFRelease(code);
  }
  CFRelease(requirement);
  return status;
}
