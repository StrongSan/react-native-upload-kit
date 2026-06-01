# Spring Boot Multipart APIs

Spring Boot controllers commonly receive files with `@RequestPart`, `@RequestParam`, or `MultipartHttpServletRequest`.

## Single File

```java
@PostMapping(value = "/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public Map<String, String> upload(@RequestPart("image") MultipartFile image) {
    return Map.of("fileName", image.getOriginalFilename());
}
```

```ts
await uploadMultipart('/api/images', {
  assets: asset,
  fileFieldName: 'image',
});
```

## Multiple Files With Repeated Field

```java
@PostMapping(value = "/posts", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public void createPost(@RequestParam("images") List<MultipartFile> images) {
    // ...
}
```

```ts
await uploadMultipart('/api/posts', {
  assets,
  fileFieldName: 'images',
  fileFieldStyle: 'repeat',
});
```

## Multiple Files With Indexed Fields

Some mobile clients and proxy layers handle repeated `FormData` keys inconsistently. Indexed names are explicit and easy to read from `MultipartHttpServletRequest`.

```java
private List<MultipartFile> resolveImages(MultipartHttpServletRequest request) {
    List<MultipartFile> files = new ArrayList<>();
    for (int index = 0; ; index++) {
        MultipartFile file = request.getFile("images_" + index);
        if (file == null || file.isEmpty()) {
            break;
        }
        files.add(file);
    }
    return files;
}
```

```ts
await uploadMultipart('/api/posts', {
  assets,
  fileFieldName: 'images',
  fileFieldStyle: 'indexed',
});
```

That sends `images_0`, `images_1`, `images_2`, and so on.
