const noop = () => () => {};

module.exports = {
  ApiProperty: noop,
  ApiPropertyOptional: noop,
  ApiTags: noop,
  ApiOperation: noop,
  ApiResponse: noop,
  ApiParam: noop,
  ApiQuery: noop,
  ApiBody: noop,
  ApiBearerAuth: noop,
  DocumentBuilder: class {
    setTitle() { return this; }
    setDescription() { return this; }
    setVersion() { return this; }
    addTag() { return this; }
    addServer() { return this; }
    addBearerAuth() { return this; }
    build() { return {}; }
  },
  SwaggerModule: {
    createDocument: () => ({}),
    setup: () => {},
  },
};
