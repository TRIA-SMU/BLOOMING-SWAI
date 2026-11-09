package com.blooming.backend.ai;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 작은 JSON 파서. 객체는 Map, 배열은 List, 문자열은 String, 숫자는 Long/Double, true/false, null.
 * (Spring의 BasicJsonParser가 따옴표·쉼표가 섞인 문장을 제대로 못 읽어서 직접 만듦)
 */
public final class SimpleJson {

    private final String s;
    private int i;

    private SimpleJson(String s) {
        this.s = s;
    }

    @SuppressWarnings("unchecked")
    public static Map<String, Object> parseMap(String json) {
        Object value = parse(json);
        if (!(value instanceof Map)) {
            throw new IllegalArgumentException("JSON 객체가 아님");
        }
        return (Map<String, Object>) value;
    }

    public static Object parse(String json) {
        SimpleJson p = new SimpleJson(json);
        p.skipWs();
        Object v = p.readValue();
        p.skipWs();
        if (p.i != p.s.length()) {
            throw new IllegalArgumentException("JSON 뒤에 남은 글자가 있음: " + p.i);
        }
        return v;
    }

    private Object readValue() {
        skipWs();
        if (i >= s.length()) {
            throw new IllegalArgumentException("JSON이 중간에 끝남");
        }
        char c = s.charAt(i);
        if (c == '{') return readObject();
        if (c == '[') return readArray();
        if (c == '"') return readString();
        if (s.startsWith("true", i)) { i += 4; return Boolean.TRUE; }
        if (s.startsWith("false", i)) { i += 5; return Boolean.FALSE; }
        if (s.startsWith("null", i)) { i += 4; return null; }
        return readNumber();
    }

    private Map<String, Object> readObject() {
        Map<String, Object> map = new LinkedHashMap<>();
        i++; // {
        skipWs();
        if (peek() == '}') { i++; return map; }
        while (true) {
            skipWs();
            String key = readString();
            skipWs();
            expect(':');
            Object value = readValue();
            map.put(key, value);
            skipWs();
            char c = next();
            if (c == '}') return map;
            if (c != ',') throw new IllegalArgumentException("객체에서 , 또는 } 가 필요함: " + i);
        }
    }

    private List<Object> readArray() {
        List<Object> list = new ArrayList<>();
        i++; // [
        skipWs();
        if (peek() == ']') { i++; return list; }
        while (true) {
            list.add(readValue());
            skipWs();
            char c = next();
            if (c == ']') return list;
            if (c != ',') throw new IllegalArgumentException("배열에서 , 또는 ] 가 필요함: " + i);
        }
    }

    private String readString() {
        expect('"');
        StringBuilder sb = new StringBuilder();
        while (true) {
            char c = next();
            if (c == '"') return sb.toString();
            if (c == '\\') {
                char e = next();
                switch (e) {
                    case '"' -> sb.append('"');
                    case '\\' -> sb.append('\\');
                    case '/' -> sb.append('/');
                    case 'b' -> sb.append('\b');
                    case 'f' -> sb.append('\f');
                    case 'n' -> sb.append('\n');
                    case 'r' -> sb.append('\r');
                    case 't' -> sb.append('\t');
                    case 'u' -> {
                        sb.append((char) Integer.parseInt(s.substring(i, i + 4), 16));
                        i += 4;
                    }
                    default -> sb.append(e);
                }
            } else {
                sb.append(c);
            }
        }
    }

    private Object readNumber() {
        int start = i;
        while (i < s.length() && "+-0123456789.eE".indexOf(s.charAt(i)) >= 0) {
            i++;
        }
        String num = s.substring(start, i);
        if (num.isEmpty()) {
            throw new IllegalArgumentException("알 수 없는 값: " + i);
        }
        if (num.contains(".") || num.contains("e") || num.contains("E")) {
            return Double.parseDouble(num);
        }
        return Long.parseLong(num);
    }

    private void skipWs() {
        while (i < s.length() && Character.isWhitespace(s.charAt(i))) {
            i++;
        }
    }

    private char peek() {
        return i < s.length() ? s.charAt(i) : '\0';
    }

    private char next() {
        if (i >= s.length()) {
            throw new IllegalArgumentException("JSON이 중간에 끝남");
        }
        return s.charAt(i++);
    }

    private void expect(char c) {
        if (next() != c) {
            throw new IllegalArgumentException("'" + c + "' 가 필요함: " + (i - 1));
        }
    }
}
