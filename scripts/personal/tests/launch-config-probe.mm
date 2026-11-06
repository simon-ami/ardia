#import "ArdiaLaunchConfig.h"

int main(int argc, const char *argv[]) {
  @autoreleasepool {
    if (argc != 3) return 64;
    NSBundle *bundle = [NSBundle bundleWithPath:[NSString stringWithUTF8String:argv[1]]];
    NSData *input = [[NSString stringWithUTF8String:argv[2]] dataUsingEncoding:NSUTF8StringEncoding];
    NSDictionary *environment = [NSJSONSerialization JSONObjectWithData:input options:0 error:nil];
    if (!bundle || !environment) return 65;
    ArdiaLaunchConfig *config = [[ArdiaLaunchConfig alloc] initWithEnvironment:environment
                                                                    bundle:bundle
                                                     signedForDistribution:^BOOL { return NO; }];
    NSData *output = [NSJSONSerialization dataWithJSONObject:config.snapshot options:0 error:nil];
    if (!output) return 66;
    printf("%s\n", [[NSString alloc] initWithData:output encoding:NSUTF8StringEncoding].UTF8String);
    return 0;
  }
}
