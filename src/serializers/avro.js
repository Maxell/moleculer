/*
 * moleculer
 * Copyright (c) 2018 MoleculerJS (https://github.com/moleculerjs/moleculer)
 * MIT Licensed
 */

"use strict";

const BaseSerializer = require("./base");
const P = require("../packets");

function createSchemas() {
	const avro = require("avsc");
	const schemas = {};

	schemas[P.PACKET_EVENT] = avro.Type.forSchema({
		name: P.PACKET_EVENT,
		type: "record",
		fields: [
			{ name: "ver", type: "string" },
			{ name: "sender", type: "string" },
			{ name: "event", type: "string" },
			{ name: "data", type: [ "null", "string"], default: null },
			{ name: "groups", type: [ "null", {
				type: "array",
				items: "string"
			}], default: null },
			{ name: "broadcast", type: "boolean" }
		]
	});

	schemas[P.PACKET_REQUEST] = avro.Type.forSchema({
		name: P.PACKET_REQUEST,
		type: "record",
		fields: [
			{ name: "ver", type: "string" },
			{ name: "sender", type: "string" },
			{ name: "id", type: "string" },
			{ name: "action", type: "string" },
			{ name: "params", type: ["null", "string", "bytes"], default: null },
			{ name: "meta", type: "string" },
			{ name: "timeout", type: [ "null", "double"], default: null },
			{ name: "level", type: "int" },
			{ name: "metrics", type: [ "null", "boolean"], default: null },
			{ name: "parentID", type: [ "null", "string"], default: null },
			{ name: "requestID", type: [ "null", "string"], default: null },
			{ name: "stream", type: [ "null", "boolean"], default: null }
		]
	});

	schemas[P.PACKET_RESPONSE] = avro.Type.forSchema({
		name: P.PACKET_RESPONSE,
		type: "record",
		fields: [
			{ name: "ver", type: "string" },
			{ name: "sender", type: "string" },
			{ name: "id", type: "string" },
			{ name: "success", type: "boolean" },
			{ name: "data", type: [ "null", "string", "bytes"], default: null },
			{ name: "error", type: [ "null", "string"], default: null },
			{ name: "meta", type: "string" },
			{ name: "stream", type: [ "null", "boolean"], default: null }
		]
	});

	schemas[P.PACKET_DISCOVER] = avro.Type.forSchema({
		name: P.PACKET_DISCOVER,
		type: "record",
		fields: [
			{ name: "ver", type: "string" },
			{ name: "sender", type: "string" }
		]
	});

	schemas[P.PACKET_INFO] = avro.Type.forSchema({
		name: P.PACKET_INFO,
		type: "record",
		fields: [
			{ name: "ver", type: "string" },
			{ name: "sender", type: "string" },
			{ name: "services", type: "string" },
			{ name: "config", type: "string" },
			{ name: "ipList", type: {
				type: "array",
				items: "string"
			} },
			{ name: "hostname", type: "string" },
			{ name: "client", type: {
				type: "record",
				fields: [
					{ name: "type", type: "string" },
					{ name: "version", type: "string" },
					{ name: "langVersion", type: "string" }
				]
			} }
		]
	});

	schemas[P.PACKET_DISCONNECT] = avro.Type.forSchema({
		name: P.PACKET_DISCONNECT,
		type: "record",
		fields: [
			{ name: "ver", type: "string" },
			{ name: "sender", type: "string" }
		]
	});

	schemas[P.PACKET_HEARTBEAT] = avro.Type.forSchema({
		name: P.PACKET_HEARTBEAT,
		type: "record",
		fields: [
			{ name: "ver", type: "string" },
			{ name: "sender", type: "string" },
			{ name: "cpu", type: "double" }
		]
	});

	schemas[P.PACKET_PING] = avro.Type.forSchema({
		name: P.PACKET_PING,
		type: "record",
		fields: [
			{ name: "ver", type: "string" },
			{ name: "sender", type: "string" },
			{ name: "time", type: "long" }
		]
	});

	schemas[P.PACKET_PONG] = avro.Type.forSchema({
		name: P.PACKET_PONG,
		type: "record",
		fields: [
			{ name: "ver", type: "string" },
			{ name: "sender", type: "string" },
			{ name: "time", type: "long" },
			{ name: "arrived", type: "long" }
		]
	});

	schemas[P.PACKET_GOSSIP_HELLO] = avro.Type.forSchema({
		name: P.PACKET_GOSSIP_HELLO,
		type: "record",
		fields: [
			{ name: "ver", type: "string" },
			{ name: "sender", type: "string" },
			{ name: "host", type: "string" },
			{ name: "port", type: "int" }
		]
	});

	schemas[P.PACKET_GOSSIP_REQ] = avro.Type.forSchema({
		name: P.PACKET_GOSSIP_REQ,
		type: "record",
		fields: [
			{ name: "ver", type: "string" },
			{ name: "sender", type: "string" },
			{ name: "online", type: [ "null", "string"], default: null },
			{ name: "offline", type: [ "null", "string"], default: null },
		]
	});

	schemas[P.PACKET_GOSSIP_RES] = avro.Type.forSchema({
		name: P.PACKET_GOSSIP_RES,
		type: "record",
		fields: [
			{ name: "ver", type: "string" },
			{ name: "sender", type: "string" },
			{ name: "online", type: [ "null", "string"], default: null },
			{ name: "offline", type: [ "null", "string"], default: null },
		]
	});

	return schemas;
}

/**
 * Avro serializer for Moleculer
 *
 * https://github.com/mtth/avsc
 *
 * @class AvroSerializer
 */
class AvroSerializer extends BaseSerializer {

	/**
	 * Initialize Serializer
	 *
	 * @param {any} broker
	 *
	 * @memberof Serializer
	 */
	init(broker) {
		super.init(broker);

		try {
			require("avsc");
		} catch(err) {
			/* istanbul ignore next */
			this.broker.fatal("The 'avsc' package is missing! Please install it with 'npm install avsc --save' command!", err, true);
		}

		this.schemas = createSchemas(broker);
	}

	/**
	 * Serializer a JS object to Buffer
	 *
	 * @param {Object} obj
	 * @param {String} type of packet
	 * @returns {Buffer}
	 *
	 * @memberof Serializer
	 */
	serialize(obj, type) {
		this.serializeCustomFields(type, obj);

		const t = this.schemas[type].toBuffer(obj);

		return t;
	}

	/**
	 * Deserialize Buffer to JS object
	 *
	 * @param {Buffer} buf
	 * @param {String} type of packet
	 * @returns {Object}
	 *
	 * @memberof Serializer
	 */
	deserialize(buf, type) {
		const obj = this.schemas[type].fromBuffer(buf);

		this.deserializeCustomFields(type, obj);

		return obj;
	}
}

module.exports = AvroSerializer;
