# Circle: Your Reading Community — Guidelines

## Components

The design system exports these components — import them from `@ws-uoaxwod1u9zgr6kkkubj/332ffe59-bb97-4ffb-a12a-9f67c70570ca` and compose them before building anything from scratch:

`ActivityGrid`, `AdminOtpScreen`, `AdminSecurityScreen`, `AlertDialogAction`, `AlertDialogCancel`, `AlertDialogContent`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogHeader`, `AlertDialogOverlay`, `AlertDialogPortal`, `AlertDialogTitle`, `AlertDialogTrigger`, `AlertDialog`, `Alert`, `AppErrorBoundary`, `AreaSpark`, `ArticleScreen`, `AuthProvider`, `AuthScreen`, `AvatarFallback`, `AvatarImage`, `Avatar`, `Badge`, `BarChart`, `BasicProfileStep`, `BookDetailScreen`, `BooksScreen`, `BottomNav`, `Breadcrumbs`, `Button`, `CardGroup`, `CardHeader`, `ChangeEmailCard`, `ChangePhoneCard`, `ChatScreen`, `Checkbox`, `ChipGroup`, `ClubChatScreen`, `ClubDetailScreen`, `ClubEvents`, `ClubsScreen`, `Constants`, `ConversationView`, `CreatePostScreen`, `CreatePostSheet`, `DialogClose`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogOverlay`, `DialogPortal`, `DialogTitle`, `DialogTrigger`, `Dialog`, `DiscoverScreen`, `DonutChart`, `EmailAuthScreen`, `EmptyState`, `FeedSkeleton`, `Field`, `FileUpload`, `GoodreadsPanel`, `GradientHighlightCard`, `HomeScreen`, `IconButton`, `InputOTPGroup`, `InputOTPSeparator`, `InputOTPSlot`, `InputOTP`, `Input`, `Label`, `MessagesScreen`, `MetricCard`, `NotificationPreferencesScreen`, `NotificationsScreen`, `OnboardingAnalyticsScreen`, `OnboardingProgressScreen`, `OnboardingScreen`, `Pagination`, `PhoneVerifyStep`, `PostDetailScreen`, `PostImage`, `ProfileCircleScreen`, `ProfileEditScreen`, `ProfileScreen`, `ProfileSettingsScreen`, `ProfileStatsTab`, `ProgressBar`, `ProgressRing`, `Progress`, `Radio`, `RailSkeleton`, `RecommendationsRail`, `ResetPasswordScreen`, `ResumeOnboardingBanner`, `SafeAwait`, `SearchScreen`, `SectionHeading`, `SegmentedControl`, `Select`, `SelectionHint`, `SheetClose`, `SheetContent`, `SheetDescription`, `SheetFooter`, `SheetHeader`, `SheetOverlay`, `SheetPortal`, `SheetTitle`, `SheetTrigger`, `Sheet`, `SideNav`, `Skeleton`, `Slider`, `Spinner`, `SplashScreen`, `StageHeader`, `StageProgress`, `StatusDot`, `Surface`, `Switch`, `Tabs`, `TextArea`, `TextInput`, `Textarea`, `TimelineFilters`, `Toggle`, `UserProfileScreen`, `VerifyEmailScreen`

Per-component details (import stanzas, props, variants, examples) live in `.lovable/rules/libraries/{slug}/components.md` — on disk, not auto-loaded. Read that file or the component source when the name alone isn't enough.

## Theme Files

The design system's theme is delivered through the following files. The author's original source files carry the full wiring the design system needs — variable declarations, framework-specific directives, provider objects, etc. — and are the canonical import target.

- `@ws-uoaxwod1u9zgr6kkkubj/332ffe59-bb97-4ffb-a12a-9f67c70570ca/styles.css` (source — preferred import)
- `@ws-uoaxwod1u9zgr6kkkubj/332ffe59-bb97-4ffb-a12a-9f67c70570ca/dist/tokens.css` (auto-generated flat list of CSS custom properties — a raw-values fallback only; does NOT carry framework-specific wiring that the source files above provide)

