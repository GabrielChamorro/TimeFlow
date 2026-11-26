package com.teamflow.backend;
import com.teamflow.backend.security.*;
import com.teamflow.backend.models.Usuario;
import com.teamflow.backend.repositories.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class RenovacionV0519Tests {
    @Test void cookieDeProduccionEsSecureHttpOnlyYNoSeBorraPorDuplicado() {
        var refresh=mock(RefreshSessions.class);var jwt=mock(com.teamflow.backend.config.JwtService.class);
        Usuario user=new Usuario();user.setId(19L);
        var issued=new RefreshSessions.Issued("sid-fixture","refresh-fixture",System.currentTimeMillis()+60000,user);
        when(refresh.rotate("fixture")).thenReturn(new RefreshSessions.Rotation(200,issued));
        when(jwt.generateTokenForSession(user,"sid-fixture")).thenReturn("access-fixture");
        var c=new com.teamflow.backend.controllers.AuthController(mock(UsuarioRepository.class),
                mock(org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder.class),jwt,
                mock(LoginAttemptLimiter.class),refresh,false);
        var response=new MockHttpServletResponse();
        assertEquals(200,c.refresh("fixture",response).getStatusCode().value());
        String cookie=response.getHeader("Set-Cookie");
        assertNotNull(cookie);assertTrue(cookie.contains("Secure"));assertTrue(cookie.contains("HttpOnly"));
        assertTrue(cookie.contains("SameSite=Strict"));assertTrue(cookie.contains("Path=/api/auth"));
        when(refresh.rotate("fixture")).thenReturn(new RefreshSessions.Rotation(409,null));
        response=new MockHttpServletResponse();
        assertEquals(409,c.refresh("fixture",response).getStatusCode().value());assertNull(response.getHeader("Set-Cookie"));
    }
    @Test void csrfRechazaOrigenAusenteAjenoYCabeceraAusente() throws Exception {
        var guard=new CookieRequestGuard(List.of("http://localhost:5173"),true);
        for (int n=0;n<3;n++) {
            var req=new MockHttpServletRequest("POST","/api/auth/refresh");
            req.setRemoteAddr("127.0.0.1");
            if(n!=0)req.addHeader("Origin",n==1?"http://evil.test":"http://localhost:5173");
            if(n!=2)req.addHeader("X-TimeFlow-CSRF","1");
            var res=new MockHttpServletResponse();var chain=new MockFilterChain();
            guard.doFilter(req,res,chain);assertEquals(403,res.getStatus());assertNull(chain.getRequest());
        }
    }
    @Test void csrfPermiteSoloOrigenExactoConCabecera() throws Exception {
        var guard=new CookieRequestGuard(List.of("http://localhost:5173"),true);
        var req=new MockHttpServletRequest("POST","/api/auth/refresh");req.setRemoteAddr("127.0.0.1");
        req.addHeader("Origin","http://localhost:5173");req.addHeader("X-TimeFlow-CSRF","1");
        var chain=new MockFilterChain();guard.doFilter(req,new MockHttpServletResponse(),chain);assertNotNull(chain.getRequest());
    }
    @Test void produccionNoPermiteHttpNiComodines() {
        assertThrows(IllegalArgumentException.class,()->new CookieRequestGuard(List.of("http://localhost:5173"),false));
        assertThrows(IllegalArgumentException.class,()->new CookieRequestGuard(List.of("https://*.example.test"),false));
        assertThrows(IllegalArgumentException.class,()->new CookieRequestGuard(List.of("http://example.test"),true));
    }
    @Test void cookieGuardNoAutenticaOperacionesBearer() throws Exception {
        var guard=new CookieRequestGuard(List.of("http://localhost:5173"),true);
        var chain=new MockFilterChain();guard.doFilter(new MockHttpServletRequest("PUT","/api/tareas/1"),new MockHttpServletResponse(),chain);
        assertNotNull(chain.getRequest());
    }
    @Test void tokenRenovacionInvalidoNoConsultaLaBase() {
        var jdbc=mock(JdbcTemplate.class);var r=new RefreshSessions(jdbc,mock(UsuarioRepository.class),mock(SessionRegistry.class),60000);
        assertEquals(401,r.rotate(null).status());assertEquals(401,r.rotate("ilegítimo").status());verifyNoInteractions(jdbc);
    }
    @Test void crearSesionUsaAleatoriedadYNoAlmacenaTokenEnClaro() {
        var jdbc=mock(JdbcTemplate.class);var registry=mock(SessionRegistry.class);
        var r=new RefreshSessions(jdbc,mock(UsuarioRepository.class),registry,60000);
        Usuario user=new Usuario();user.setId(19L);var a=r.create(user);var b=r.create(user);
        assertNotEquals(a.refresh(),b.refresh());assertEquals(80,a.refresh().length());
        var hashes=org.mockito.ArgumentCaptor.forClass(Object.class);
        verify(jdbc,times(2)).update(eq("INSERT INTO renovaciones_jwt (token_hash, session_hash) VALUES (?,?)"),hashes.capture(),any());
        assertTrue(hashes.getAllValues().stream().allMatch(x->x.toString().matches("[a-f0-9]{64}")));
        verify(registry).register(eq(a.sessionId()),eq(19L),anyLong());
    }
}
